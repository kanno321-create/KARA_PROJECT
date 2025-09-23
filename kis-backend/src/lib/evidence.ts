import type { EstimateRequest, Evidence, EvidenceTableRowSchema } from './validators.js';
import type { MCCBDimension } from './size-tables.js';
import { getSize } from './size-tables.js';
import { config } from '../config.js';

// ============================================
// 증거 패키지 생성
// ============================================

export function generateEvidence(
  estimateId: string,
  request: EstimateRequest,
  usedDimensions: MCCBDimension[]
): Omit<Evidence, 'id' | 'createdAt'> {
  console.log('Generating evidence package for estimate:', estimateId);

  return {
    estimateId,
    rulesDoc: generateRulesDocReference(request),
    tables: generateTablesReference(usedDimensions),
    brandPolicy: generateBrandPolicy(request),
    snapshot: generateSnapshot(request),
    version: {
      rules: config.knowledge.rulesVersion,
      tables: config.knowledge.tablesVersion,
    },
  };
}

// ============================================
// 규칙 문서 참조 생성
// ============================================

function generateRulesDocReference(request: EstimateRequest): string {
  const sections: string[] = [];

  // 기본 앵커
  sections.push('KIS_Enclosure_Rules.md#핵심-원칙');

  // 브랜드별 섹션
  if (request.brand === 'MIXED') {
    sections.push('KIS_Enclosure_Rules.md#혼합-브랜드-예외');
  } else {
    sections.push('KIS_Enclosure_Rules.md#단일-브랜드-원칙');
  }

  // 형태별 섹션
  if (request.form === 'STANDARD') {
    sections.push('KIS_Enclosure_Rules.md#표준형');
  } else {
    sections.push('KIS_Enclosure_Rules.md#경제형-기본');
  }

  // 디바이스 타입별 섹션
  if (request.device.type === 'ELCB') {
    sections.push('KIS_Enclosure_Rules.md#elcb-누전-차단기');
  } else {
    sections.push('KIS_Enclosure_Rules.md#mccb-배선용-차단기');
  }

  // 설치 관련 섹션
  sections.push('KIS_Enclosure_Rules.md#설치-위치방식');

  // 크기 계산 섹션
  sections.push('KIS_Enclosure_Rules.md#외함-크기-계산-알고리즘');

  // 게이트 검증 섹션
  sections.push('KIS_Enclosure_Rules.md#입력-게이트-정의');

  return sections.join(', ');
}

// ============================================
// 테이블 참조 생성
// ============================================

function generateTablesReference(usedDimensions: MCCBDimension[]): any[] {
  const tableMap = new Map<string, string[]>();

  // 사용된 치수들을 테이블별로 그룹화
  usedDimensions.forEach(dimension => {
    let tableName: string;
    let rowIdentifier: string;

    if (dimension.brand === 'LS') {
      tableName = 'LS_Metasol_MCCB_dimensions_by_AF_and_poles.csv';
      rowIdentifier = `METASOL-${dimension.af}(${dimension.poles})`;
    } else if (dimension.brand === 'SANGDO') {
      tableName = 'Sangdo_MCCB_dimensions_by_AF_model_poles.csv';
      rowIdentifier = `${dimension.model}(${dimension.poles})`;
    } else {
      tableName = 'unknown_table.csv';
      rowIdentifier = 'unknown_row';
    }

    if (!tableMap.has(tableName)) {
      tableMap.set(tableName, []);
    }
    tableMap.get(tableName)!.push(rowIdentifier);
  });

  // Map을 배열로 변환
  return Array.from(tableMap.entries()).map(([source, rows]) => ({
    source,
    rows: [...new Set(rows)], // 중복 제거
  }));
}

// ============================================
// 브랜드 정책 생성
// ============================================

function generateBrandPolicy(request: EstimateRequest): string {
  if (request.brand === 'MIXED') {
    return 'explicit MIXED brand with allowMixedBrand=true';
  } else {
    return 'single-brand or explicit MIXED only';
  }
}

// ============================================
// 요청 스냅샷 생성 (정규화)
// ============================================

function generateSnapshot(request: EstimateRequest): Record<string, any> {
  // 민감한 정보 제거 및 정규화
  const snapshot = {
    brand: request.brand,
    form: request.form,
    installation: {
      location: request.installation.location,
      mount: request.installation.mount,
    },
    device: {
      type: request.device.type,
    },
    main: {
      model: request.main.model || null,
      af: request.main.af || null,
      poles: request.main.poles,
    },
    branches: request.branches.map(branch => ({
      model: branch.model || null,
      af: branch.af || null,
      poles: branch.poles,
      qty: branch.qty,
    })),
    accessories: {
      enabled: request.accessories.enabled,
      itemCount: request.accessories.items?.length || 0,
    },
    // 메타데이터
    metadata: {
      totalBranches: request.branches.length,
      totalBranchQty: request.branches.reduce((sum, b) => sum + b.qty, 0),
      hasAccessories: request.accessories.enabled,
      uniqueModels: countUniqueModels(request),
    },
  };

  return snapshot;
}

// ============================================
// 고유 모델 수 계산
// ============================================

function countUniqueModels(request: EstimateRequest): number {
  const models = new Set<string>();

  if (request.main.model) {
    models.add(request.main.model);
  }

  request.branches.forEach(branch => {
    if (branch.model) {
      models.add(branch.model);
    }
  });

  return models.size;
}

// ============================================
// 증거 저장용 데이터 수집
// ============================================

export function collectUsedDimensions(request: EstimateRequest): MCCBDimension[] {
  const dimensions: MCCBDimension[] = [];

  // 메인 차단기 치수
  if (request.main.model || request.main.af) {
    const mainDim = getSize(request.brand, request.main.model, request.main.af, request.main.poles);
    if (mainDim) {
      dimensions.push(mainDim);
    }
  }

  // 분기 차단기 치수
  request.branches.forEach(branch => {
    if (branch.model || branch.af) {
      const branchDim = getSize(request.brand, branch.model, branch.af, branch.poles);
      if (branchDim) {
        dimensions.push(branchDim);
      }
    }
  });

  return dimensions;
}

// ============================================
// 증거 패키지 유효성 검증
// ============================================

export function validateEvidence(evidence: Evidence): boolean {
  try {
    // 필수 필드 검증
    if (!evidence.estimateId || !evidence.rulesDoc || !evidence.brandPolicy) {
      return false;
    }

    // 테이블 참조 검증
    if (!Array.isArray(evidence.tables) || evidence.tables.length === 0) {
      return false;
    }

    // 스냅샷 검증
    if (!evidence.snapshot || typeof evidence.snapshot !== 'object') {
      return false;
    }

    // 버전 정보 검증
    if (!evidence.version || !evidence.version.rules || !evidence.version.tables) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Evidence validation error:', error);
    return false;
  }
}

// ============================================
// 증거 패키지 요약 생성
// ============================================

export function generateEvidenceSummary(evidence: Evidence): {
  rulesUsed: number;
  tablesUsed: number;
  totalRows: number;
  brandPolicy: string;
  knowledgeVersion: string;
} {
  const rulesUsed = evidence.rulesDoc.split(',').length;
  const tablesUsed = evidence.tables.length;
  const totalRows = evidence.tables.reduce((sum, table) => sum + table.rows.length, 0);

  return {
    rulesUsed,
    tablesUsed,
    totalRows,
    brandPolicy: evidence.brandPolicy,
    knowledgeVersion: `rules:${evidence.version.rules}, tables:${evidence.version.tables}`,
  };
}

// ============================================
// 증거 패키지 비교 (버전 관리용)
// ============================================

export function compareEvidence(evidence1: Evidence, evidence2: Evidence): {
  sameRules: boolean;
  sameTables: boolean;
  samePolicy: boolean;
  sameVersion: boolean;
} {
  return {
    sameRules: evidence1.rulesDoc === evidence2.rulesDoc,
    sameTables: JSON.stringify(evidence1.tables) === JSON.stringify(evidence2.tables),
    samePolicy: evidence1.brandPolicy === evidence2.brandPolicy,
    sameVersion: evidence1.version.rules === evidence2.version.rules &&
                 evidence1.version.tables === evidence2.version.tables,
  };
}