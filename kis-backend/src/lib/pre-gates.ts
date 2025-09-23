// ============================================
// Pre-Gate 입력 검증 미들웨어
// 3-게이트/브랜드/형태/극수/장소/마운트 선검증
// ============================================

import { config } from '../config.js';

// ============================================
// 에러 타입 정의
// ============================================

export interface PreGateError {
  ok: false;
  code: string;
  message: string;
  path: string;
  hint?: string;
}

export interface PreGateSuccess {
  ok: true;
  resolvedBrand?: string;
  warnings?: string[];
}

export type PreGateResult = PreGateSuccess | PreGateError;

// ============================================
// 입력 타입 정의
// ============================================

interface EstimateRequestInput {
  brand: 'SANGDO' | 'LS' | 'MIXED';
  form: 'ECONOMIC' | 'STANDARD';
  installation: {
    location: 'INDOOR' | 'OUTDOOR';
    mount: 'FLUSH' | 'SURFACE';
  };
  device: {
    type: string;
    purpose?: string;
    feeder?: string;
    gates?: number;
  };
  main: {
    enabled: boolean;
    af?: number;
    at?: number;
    poles?: number;
    model?: string;
  };
  branches: Array<{
    af?: number;
    at?: number;
    poles?: number;
    count?: number;
    model?: string;
    remark?: string;
  }>;
  accessories: {
    enabled: boolean;
    items?: Array<{
      name: string;
      count: number;
    }>;
  };
}

// ============================================
// Pre-Gate 검증 함수
// ============================================

export function preGateEstimateInput(reqBody: any): PreGateResult {
  try {
    const input = reqBody as EstimateRequestInput;

    // 1. 3-게이트 충족 검증
    const gateResult = validate3Gates(input);
    if (!gateResult.ok) return gateResult;

    // 2. 브랜드 단일 원칙 검증
    const brandResult = validateBrandConsistency(input);
    if (!brandResult.ok) return brandResult;

    // 3. 형태 검증 (도면 표기 vs 요청)
    const formResult = validateFormConsistency(input);
    if (!formResult.ok) return formResult;

    // 4. 장소/마운트 일관성 검증
    const installResult = validateInstallationConsistency(input);
    if (!installResult.ok) return installResult;

    // 5. 극수/모델 타입 일관성 검증
    const deviceResult = validateDeviceTypeConsistency(input);
    if (!deviceResult.ok) return deviceResult;

    // 모든 검증 통과
    return {
      ok: true,
      resolvedBrand: resolveFinalBrand(input),
      warnings: [],
    };
  } catch (error) {
    return {
      ok: false,
      code: 'INVALID_REQUEST_FORMAT',
      message: '요청 형식이 올바르지 않습니다',
      path: 'root',
      hint: 'JSON 스키마를 확인하세요',
    };
  }
}

// ============================================
// 1. 3-게이트 검증
// ============================================

function validate3Gates(input: EstimateRequestInput): PreGateResult {
  // Gate 1: 메인 차단기 (enabled=true인 경우)
  if (input.main.enabled) {
    if (!input.main.af || !input.main.at || !input.main.poles) {
      return {
        ok: false,
        code: 'REQ_MORE_INFO',
        message: '메인 차단기 정보가 부족합니다. AF, AT, 극수를 모두 입력해 주세요',
        path: 'main',
        hint: '예시: {AF:630, AT:630, poles:4}',
      };
    }
  }

  // Gate 2: 분기 차단기 (최소 1개 필요)
  if (!input.branches || input.branches.length === 0) {
    return {
      ok: false,
      code: 'REQ_MORE_INFO',
      message: '분기 차단기 정보가 없습니다. 최소 1개 이상의 분기를 입력해 주세요',
      path: 'branches',
      hint: '예시: [{AF:100, AT:100, poles:3, count:4}]',
    };
  }

  // 분기별 필수 정보 검증
  for (let i = 0; i < input.branches.length; i++) {
    const branch = input.branches[i];
    if (!branch.af || !branch.at || !branch.poles || !branch.count) {
      return {
        ok: false,
        code: 'REQ_MORE_INFO',
        message: `분기 ${i + 1}번의 정보가 부족합니다. AF, AT, 극수, 수량을 모두 입력해 주세요`,
        path: `branches[${i}]`,
        hint: '예시: {AF:100, AT:100, poles:3, count:4}',
      };
    }

    // 수량은 양수여야 함
    if (branch.count <= 0) {
      return {
        ok: false,
        code: 'INVALID_COUNT',
        message: `분기 ${i + 1}번의 수량은 1 이상이어야 합니다`,
        path: `branches[${i}].count`,
        hint: '수량: 1 이상의 정수',
      };
    }
  }

  // Gate 3: 부속자재 유무 명시
  if (input.accessories.enabled === undefined || input.accessories.enabled === null) {
    return {
      ok: false,
      code: 'REQ_MORE_INFO',
      message: '부속자재 사용 여부를 명시해 주세요',
      path: 'accessories.enabled',
      hint: 'true: 부속자재 사용, false: 부속자재 미사용',
    };
  }

  // 부속자재 사용시 items 검증
  if (input.accessories.enabled) {
    if (!input.accessories.items || input.accessories.items.length === 0) {
      return {
        ok: false,
        code: 'REQ_MORE_INFO',
        message: '부속자재를 사용한다고 했는데 구체적인 항목이 없습니다',
        path: 'accessories.items',
        hint: '예시: [{name:"단자대", count:10}]',
      };
    }

    for (let i = 0; i < input.accessories.items.length; i++) {
      const item = input.accessories.items[i];
      if (!item.name || !item.count || item.count <= 0) {
        return {
          ok: false,
          code: 'REQ_MORE_INFO',
          message: `부속자재 ${i + 1}번의 정보가 부족합니다`,
          path: `accessories.items[${i}]`,
          hint: '예시: {name:"단자대", count:10}',
        };
      }
    }
  }

  return { ok: true };
}

// ============================================
// 2. 브랜드 단일 원칙 검증
// ============================================

function validateBrandConsistency(input: EstimateRequestInput): PreGateResult {
  const requestedBrand = input.brand;

  // MIXED 브랜드 요청 시 설정 확인
  if (requestedBrand === 'MIXED') {
    if (!config.features.allowMixedBrand) {
      return {
        ok: false,
        code: 'BRAND_CONFLICT',
        message: '혼합 브랜드가 허용되지 않습니다. 단일 브랜드를 선택해 주세요',
        path: 'brand',
        hint: 'SANGDO 또는 LS 중 선택',
      };
    }
  }

  // 메인과 분기 브랜드 일관성 검증 (MIXED가 아닌 경우)
  if (requestedBrand !== 'MIXED') {
    // 메인 차단기 모델 브랜드 검증
    if (input.main.enabled && input.main.model) {
      const mainBrandFromModel = detectBrandFromModel(input.main.model);
      if (mainBrandFromModel && mainBrandFromModel !== requestedBrand) {
        return {
          ok: false,
          code: 'BRAND_CONFLICT',
          message: `메인 차단기 모델 ${input.main.model}은 ${mainBrandFromModel} 제품입니다. 요청 브랜드(${requestedBrand})와 다릅니다`,
          path: 'main.model',
          hint: `${requestedBrand} 제품을 선택하거나 brand를 MIXED로 변경하세요`,
        };
      }
    }

    // 분기 차단기 모델 브랜드 검증
    for (let i = 0; i < input.branches.length; i++) {
      const branch = input.branches[i];
      if (branch.model) {
        const branchBrandFromModel = detectBrandFromModel(branch.model);
        if (branchBrandFromModel && branchBrandFromModel !== requestedBrand) {
          return {
            ok: false,
            code: 'BRAND_CONFLICT',
            message: `분기 ${i + 1}번 모델 ${branch.model}은 ${branchBrandFromModel} 제품입니다. 요청 브랜드(${requestedBrand})와 다릅니다`,
            path: `branches[${i}].model`,
            hint: `${requestedBrand} 제품을 선택하거나 brand를 MIXED로 변경하세요`,
          };
        }
      }
    }
  }

  return { ok: true };
}

// ============================================
// 3. 형태 일관성 검증
// ============================================

function validateFormConsistency(input: EstimateRequestInput): PreGateResult {
  const requestedForm = input.form;

  // 도면 표기가 없으면 ECONOMIC으로 기본 설정
  // 여기서는 명시적으로 STANDARD를 요청했는데 다른 지표가 ECONOMIC을 가리키는 경우를 체크

  // 현재는 단순하게 처리하지만, 실제로는 모델명이나 다른 필드에서
  // 형태 힌트를 얻어서 검증할 수 있음

  if (requestedForm !== 'ECONOMIC' && requestedForm !== 'STANDARD') {
    return {
      ok: false,
      code: 'FORM_DEFAULT_OVERRIDE',
      message: '형태는 ECONOMIC 또는 STANDARD만 가능합니다',
      path: 'form',
      hint: 'ECONOMIC: 경제형, STANDARD: 표준형',
    };
  }

  return { ok: true };
}

// ============================================
// 4. 장소/마운트 일관성 검증
// ============================================

function validateInstallationConsistency(input: EstimateRequestInput): PreGateResult {
  const { location, mount } = input.installation;

  // 필수 값 검증
  if (!location || !mount) {
    return {
      ok: false,
      code: 'REQ_MORE_INFO',
      message: '설치 장소와 마운트 방식을 모두 지정해 주세요',
      path: 'installation',
      hint: 'location: INDOOR|OUTDOOR, mount: FLUSH|SURFACE',
    };
  }

  // 값 유효성 검증
  if (!['INDOOR', 'OUTDOOR'].includes(location)) {
    return {
      ok: false,
      code: 'LOCATION_MISMATCH',
      message: '설치 장소는 INDOOR 또는 OUTDOOR만 가능합니다',
      path: 'installation.location',
      hint: 'INDOOR: 옥내, OUTDOOR: 옥외',
    };
  }

  if (!['FLUSH', 'SURFACE'].includes(mount)) {
    return {
      ok: false,
      code: 'MOUNT_MISMATCH',
      message: '마운트 방식은 FLUSH 또는 SURFACE만 가능합니다',
      path: 'installation.mount',
      hint: 'FLUSH: 매입형, SURFACE: 노출형',
    };
  }

  // 논리적 상충 검증 (예: 옥외인데 매입형은 일반적이지 않음)
  if (location === 'OUTDOOR' && mount === 'FLUSH') {
    // 경고는 하되 에러는 아님 (실제로 가능한 경우가 있을 수 있음)
  }

  return { ok: true };
}

// ============================================
// 5. 극수/모델 타입 일관성 검증
// ============================================

function validateDeviceTypeConsistency(input: EstimateRequestInput): PreGateResult {
  const deviceType = input.device.type;

  // 메인 차단기 검증
  if (input.main.enabled && input.main.model) {
    const modelType = detectDeviceTypeFromModel(input.main.model);
    if (modelType && deviceType && modelType !== deviceType) {
      return {
        ok: false,
        code: 'DEVICE_TYPE_MISMATCH',
        message: `메인 모델 ${input.main.model}은 ${modelType}입니다. device.type=${deviceType}와 다릅니다`,
        path: 'device.type',
        hint: `device.type을 ${modelType}로 변경하세요`,
      };
    }

    // 극수 유효성 검증
    if (input.main.poles) {
      const validPoles = getValidPolesForModel(input.main.model);
      if (validPoles.length > 0 && !validPoles.includes(input.main.poles)) {
        return {
          ok: false,
          code: 'POLES_MISMATCH',
          message: `모델 ${input.main.model}은 ${validPoles.join(',')}극만 지원합니다`,
          path: 'main.poles',
          hint: `유효한 극수: ${validPoles.join(', ')}`,
        };
      }
    }
  }

  // 분기 차단기 검증
  for (let i = 0; i < input.branches.length; i++) {
    const branch = input.branches[i];
    if (branch.model && branch.poles) {
      const validPoles = getValidPolesForModel(branch.model);
      if (validPoles.length > 0 && !validPoles.includes(branch.poles)) {
        return {
          ok: false,
          code: 'POLES_MISMATCH',
          message: `분기 ${i + 1}번 모델 ${branch.model}은 ${validPoles.join(',')}극만 지원합니다`,
          path: `branches[${i}].poles`,
          hint: `유효한 극수: ${validPoles.join(', ')}`,
        };
      }
    }
  }

  return { ok: true };
}

// ============================================
// 헬퍼 함수들
// ============================================

function detectBrandFromModel(model: string): string | null {
  const modelUpper = model.toUpperCase();

  // 상도 모델 패턴
  if (modelUpper.startsWith('SBS') || modelUpper.startsWith('SES') || modelUpper.startsWith('SEE')) {
    return 'SANGDO';
  }

  // LS 모델 패턴
  if (modelUpper.startsWith('ABS') || modelUpper.startsWith('ABN') || modelUpper.includes('METASOL')) {
    return 'LS';
  }

  return null;
}

function detectDeviceTypeFromModel(model: string): string | null {
  const modelUpper = model.toUpperCase();

  // ELCB 패턴 (누전차단기)
  if (modelUpper.startsWith('SES') || modelUpper.startsWith('SEE')) {
    return 'ELCB';
  }

  // MCCB 패턴 (배선용차단기)
  if (modelUpper.startsWith('SBS') || modelUpper.startsWith('ABS') || modelUpper.startsWith('ABN')) {
    return 'MCCB';
  }

  return null;
}

function getValidPolesForModel(model: string): number[] {
  const modelUpper = model.toUpperCase();

  // 대부분의 MCCB는 3P, 4P 지원
  if (modelUpper.startsWith('SBS') || modelUpper.startsWith('ABS')) {
    return [3, 4];
  }

  // 일부 소용량은 1P, 2P도 지원
  if (modelUpper.includes('-50') || modelUpper.includes('-30')) {
    return [1, 2, 3, 4];
  }

  // ELCB는 보통 3P, 4P
  if (modelUpper.startsWith('SES') || modelUpper.startsWith('SEE')) {
    return [3, 4];
  }

  // 기본값
  return [3, 4];
}

function resolveFinalBrand(input: EstimateRequestInput): string {
  if (input.brand === 'MIXED') {
    return 'MIXED';
  }

  return input.brand;
}