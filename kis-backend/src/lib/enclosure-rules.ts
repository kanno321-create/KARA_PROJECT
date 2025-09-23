import type { EstimateRequest, EnclosureResult, Form } from './validators.js';
import { getSize, type MCCBDimension } from './size-tables.js';
import { findDimensionKeyed, type MCCBDimension as NewMCCBDimension } from './size-tables-v2.js';
import { errors } from './errors.js';

// ============================================
// 배치 계산을 위한 타입
// ============================================

interface BreakerItem {
  type: 'main' | 'branch';
  model?: string;
  af?: number;
  poles: string;
  qty: number;
  dimensions: NewMCCBDimension;
  index?: number; // 분기의 경우 인덱스
}

interface LayoutRow {
  items: BreakerItem[];
  totalWidth: number;
  maxHeight: number;
  maxDepth: number;
}

interface LayoutResult {
  rows: LayoutRow[];
  totalWidth: number;
  totalHeight: number;
  totalDepth: number;
  itemCount: number;
}

// ============================================
// 외함 크기 계산 메인 함수
// ============================================

export function calculateEnclosureSize(request: EstimateRequest): EnclosureResult {
  console.log('Calculating enclosure size for request:', JSON.stringify(request, null, 2));

  // 1. 모든 차단기의 치수 정보 수집
  const items = collectBreakerItems(request);

  // 2. 차단기 배치 계산
  const layout = calculateLayout(items, request.form);

  // 3. 외함 크기 산출
  const { W, H, D } = calculateFinalDimensions(layout, request.form);

  return {
    W,
    H,
    D,
    form: request.form,
    layout: {
      rows: layout.rows.length,
      maxWidthPerRow: layout.totalWidth,
      totalItems: layout.itemCount,
    },
  };
}

// ============================================
// 차단기 아이템 수집
// ============================================

function collectBreakerItems(request: EstimateRequest): BreakerItem[] {
  const items: BreakerItem[] = [];

  // 메인 차단기 추가
  const mainDimensions = getMainBreakerDimensions(request);
  if (mainDimensions) {
    items.push({
      type: 'main',
      model: request.main.model,
      af: request.main.af,
      poles: request.main.poles,
      qty: 1,
      dimensions: mainDimensions,
    });
  }

  // 분기 차단기 추가
  request.branches.forEach((branch, index) => {
    const branchDimensions = getBranchBreakerDimensions(request, branch, index);
    if (branchDimensions) {
      items.push({
        type: 'branch',
        model: branch.model,
        af: branch.af,
        poles: branch.poles,
        qty: branch.qty,
        dimensions: branchDimensions,
        index,
      });
    }
  });

  return items;
}

// ============================================
// 메인 차단기 치수 조회
// ============================================

function getMainBreakerDimensions(request: EstimateRequest): NewMCCBDimension | null {
  const { brand, main } = request;

  // Use the new versioned knowledge system
  const dimensions = findDimensionKeyed(brand, main.model, main.af, main.poles?.toString());

  if (!dimensions) {
    // ABSTAIN: 메인 차단기 치수 정보 부족
    throw errors.needKnowledgeUpdate(
      `NEED_KNOWLEDGE_UPDATE: ${brand} 메인 차단기 ${main.model || `AF${main.af}`}(${main.poles}) 치수 행이 없습니다.`,
      `width_mm, height_mm, depth_mm를 알려주시면 즉시 반영하겠습니다. (예시: 210,275,103)`
    );
  }

  return dimensions;
}

// ============================================
// 분기 차단기 치수 조회
// ============================================

function getBranchBreakerDimensions(
  request: EstimateRequest,
  branch: any,
  index: number
): NewMCCBDimension | null {
  const { brand } = request;

  // Use the new versioned knowledge system
  const dimensions = findDimensionKeyed(brand, branch.model, branch.af, branch.poles?.toString());

  if (!dimensions) {
    // ABSTAIN: 분기 차단기 치수 정보 부족
    throw errors.needKnowledgeUpdate(
      `NEED_KNOWLEDGE_UPDATE: ${brand} 분기 차단기 ${index + 1}번 ${branch.model || `AF${branch.af}`}(${branch.poles}) 치수 행이 없습니다.`,
      `width_mm, height_mm, depth_mm를 알려주시면 즉시 반영하겠습니다.`
    );
  }

  return dimensions;
}

// ============================================
// 배치 계산 (경제형 알고리즘)
// ============================================

function calculateLayout(items: BreakerItem[], form: Form): LayoutResult {
  // 1. 메인 차단기 분리
  const mainItems = items.filter(item => item.type === 'main');
  const branchItems = items.filter(item => item.type === 'branch');

  // 2. 분기 차단기 정렬 (프레임 큰 순 → 극수 많은 순 → 수량 많은 순)
  const sortedBranches = sortBranches(branchItems);

  // 3. 배치 계산
  if (form === 'ECONOMIC') {
    return calculateEconomicLayout(mainItems, sortedBranches);
  } else {
    return calculateStandardLayout(mainItems, sortedBranches);
  }
}

// ============================================
// 분기 차단기 정렬
// ============================================

function sortBranches(branches: BreakerItem[]): BreakerItem[] {
  return branches.sort((a, b) => {
    // 1. 프레임 크기 (width_mm 기준)
    const widthDiff = b.dimensions.W - a.dimensions.W;
    if (widthDiff !== 0) return widthDiff;

    // 2. 극수 (4P > 3P > 2P)
    const polesOrder = { '4P': 4, '3P': 3, '2P': 2 };
    const polesDiff = (polesOrder[b.poles as keyof typeof polesOrder] || 0) -
                      (polesOrder[a.poles as keyof typeof polesOrder] || 0);
    if (polesDiff !== 0) return polesDiff;

    // 3. 수량 (많은 순)
    return b.qty - a.qty;
  });
}

// ============================================
// 경제형 배치 계산
// ============================================

function calculateEconomicLayout(mainItems: BreakerItem[], branchItems: BreakerItem[]): LayoutResult {
  const rows: LayoutRow[] = [];
  const MAX_ROW_WIDTH = 800; // 경제형 최대 행 너비 (mm)

  // 첫 번째 행: 메인 차단기 좌측 고정
  if (mainItems.length > 0) {
    const firstRow: LayoutRow = {
      items: [...mainItems],
      totalWidth: mainItems.reduce((sum, item) => sum + item.dimensions.W, 0),
      maxHeight: Math.max(...mainItems.map(item => item.dimensions.H)),
      maxDepth: Math.max(...mainItems.map(item => item.dimensions.D)),
    };
    rows.push(firstRow);
  }

  // 분기 차단기 배치 (가로 우선, 줄바꿈)
  let currentRow: LayoutRow = {
    items: [],
    totalWidth: 0,
    maxHeight: 0,
    maxDepth: 0,
  };

  for (const branchItem of branchItems) {
    // 수량만큼 반복
    for (let i = 0; i < branchItem.qty; i++) {
      const itemWidth = branchItem.dimensions.W;

      // 현재 행에 추가할 수 있는지 확인
      if (currentRow.totalWidth + itemWidth <= MAX_ROW_WIDTH) {
        // 현재 행에 추가
        currentRow.items.push(branchItem);
        currentRow.totalWidth += itemWidth;
        currentRow.maxHeight = Math.max(currentRow.maxHeight, branchItem.dimensions.H);
        currentRow.maxDepth = Math.max(currentRow.maxDepth, branchItem.dimensions.D);
      } else {
        // 현재 행이 가득 참, 새 행 시작
        if (currentRow.items.length > 0) {
          rows.push(currentRow);
        }

        currentRow = {
          items: [branchItem],
          totalWidth: itemWidth,
          maxHeight: branchItem.dimensions.H,
          maxDepth: branchItem.dimensions.D,
        };
      }
    }
  }

  // 마지막 행 추가
  if (currentRow.items.length > 0) {
    rows.push(currentRow);
  }

  // 전체 크기 계산
  const totalWidth = Math.max(...rows.map(row => row.totalWidth));
  const totalHeight = rows.reduce((sum, row) => sum + row.maxHeight, 0);
  const totalDepth = Math.max(...rows.map(row => row.maxDepth));
  const itemCount = mainItems.length + branchItems.reduce((sum, item) => sum + item.qty, 0);

  return {
    rows,
    totalWidth,
    totalHeight,
    totalDepth,
    itemCount,
  };
}

// ============================================
// 표준형 배치 계산
// ============================================

function calculateStandardLayout(mainItems: BreakerItem[], branchItems: BreakerItem[]): LayoutResult {
  // 표준형은 경제형보다 여유있는 배치
  const MAX_ROW_WIDTH = 1000; // 표준형 최대 행 너비 (mm)

  // 경제형과 동일한 로직이지만 더 넓은 행 너비 사용
  const rows: LayoutRow[] = [];

  // 메인 차단기 배치
  if (mainItems.length > 0) {
    const firstRow: LayoutRow = {
      items: [...mainItems],
      totalWidth: mainItems.reduce((sum, item) => sum + item.dimensions.W, 0),
      maxHeight: Math.max(...mainItems.map(item => item.dimensions.H)),
      maxDepth: Math.max(...mainItems.map(item => item.dimensions.D)),
    };
    rows.push(firstRow);
  }

  // 분기 차단기 배치
  let currentRow: LayoutRow = {
    items: [],
    totalWidth: 0,
    maxHeight: 0,
    maxDepth: 0,
  };

  for (const branchItem of branchItems) {
    for (let i = 0; i < branchItem.qty; i++) {
      const itemWidth = branchItem.dimensions.W;

      if (currentRow.totalWidth + itemWidth <= MAX_ROW_WIDTH) {
        currentRow.items.push(branchItem);
        currentRow.totalWidth += itemWidth;
        currentRow.maxHeight = Math.max(currentRow.maxHeight, branchItem.dimensions.H);
        currentRow.maxDepth = Math.max(currentRow.maxDepth, branchItem.dimensions.D);
      } else {
        if (currentRow.items.length > 0) {
          rows.push(currentRow);
        }

        currentRow = {
          items: [branchItem],
          totalWidth: itemWidth,
          maxHeight: branchItem.dimensions.H,
          maxDepth: branchItem.dimensions.D,
        };
      }
    }
  }

  if (currentRow.items.length > 0) {
    rows.push(currentRow);
  }

  const totalWidth = Math.max(...rows.map(row => row.totalWidth));
  const totalHeight = rows.reduce((sum, row) => sum + row.maxHeight, 0);
  const totalDepth = Math.max(...rows.map(row => row.maxDepth));
  const itemCount = mainItems.length + branchItems.reduce((sum, item) => sum + item.qty, 0);

  return {
    rows,
    totalWidth,
    totalHeight,
    totalDepth,
    itemCount,
  };
}

// ============================================
// 최종 외함 크기 계산
// ============================================

function calculateFinalDimensions(layout: LayoutResult, form: Form): { W: number; H: number; D: number } {
  // 여백/공차 적용
  const margins = getMargins(form);

  const W = Math.ceil(layout.totalWidth + margins.left + margins.right);
  const H = Math.ceil(layout.totalHeight + margins.top + margins.bottom);
  const D = Math.ceil(layout.totalDepth + margins.front + margins.back);

  return { W, H, D };
}

// ============================================
// 형태별 여백 계산
// ============================================

function getMargins(form: Form): {
  top: number;
  bottom: number;
  left: number;
  right: number;
  front: number;
  back: number;
} {
  if (form === 'ECONOMIC') {
    // 경제형: 최소 여백
    return {
      top: 100,
      bottom: 100,
      left: 50,
      right: 50,
      front: 30,
      back: 30,
    };
  } else {
    // 표준형: 여유 여백
    return {
      top: 150,
      bottom: 150,
      left: 100,
      right: 100,
      front: 50,
      back: 50,
    };
  }
}

// ============================================
// 혼합 브랜드 처리
// ============================================

export function validateMixedBrand(request: EstimateRequest, allowMixedBrand: boolean): void {
  if (request.brand === 'MIXED') {
    if (!allowMixedBrand) {
      throw errors.brandConflict(
        '혼합 브랜드는 허용되지 않습니다. 설정에서 allowMixedBrand를 활성화해 주세요.',
        'brand'
      );
    }

    // 혼합 브랜드 로직은 더 복잡하므로 현재는 기본 검증만 수행
    console.warn('MIXED brand detected. Additional validation required.');
  }
}