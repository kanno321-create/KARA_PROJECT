import type { EstimateRequest, Brand, DeviceType } from './validators.js';
import { errors } from './errors.js';
import { getSize, getAvailableModels } from './size-tables.js';

// ============================================
// 브랜드 검증 규칙
// ============================================

/**
 * 단일 브랜드 원칙 검증
 * SANGDO/LS 혼합 금지 (MIXED 명시 시에만 예외)
 */
export function validateSingleBrand(request: EstimateRequest): void {
  const { brand, main, branches } = request;

  // MIXED 브랜드는 별도 처리
  if (brand === 'MIXED') {
    return; // MIXED는 enclosure-rules.ts에서 처리
  }

  // 메인 차단기 브랜드 검증
  if (main.model) {
    const mainBrand = detectModelBrand(main.model);
    if (mainBrand && mainBrand !== brand) {
      throw errors.brandConflict(
        `메인 차단기 모델 ${main.model}은 ${mainBrand} 브랜드입니다. 선택된 브랜드: ${brand}`,
        'main.model'
      );
    }
  }

  // 분기 차단기 브랜드 검증
  branches.forEach((branch, index) => {
    if (branch.model) {
      const branchBrand = detectModelBrand(branch.model);
      if (branchBrand && branchBrand !== brand) {
        throw errors.brandConflict(
          `분기 차단기 ${index + 1}번 모델 ${branch.model}은 ${branchBrand} 브랜드입니다. 선택된 브랜드: ${brand}`,
          `branches[${index}].model`
        );
      }
    }
  });
}

/**
 * 모델명에서 브랜드 추론
 */
export function detectModelBrand(model: string): Brand | null {
  const upperModel = model.toUpperCase();

  // SANGDO 모델 패턴
  if (upperModel.startsWith('SBS') ||
      upperModel.startsWith('SBE') ||
      upperModel.startsWith('SES') ||
      upperModel.startsWith('SEE')) {
    return 'SANGDO';
  }

  // LS 모델 패턴
  if (upperModel.includes('METASOL') ||
      upperModel.startsWith('LS') ||
      upperModel.includes('LS-')) {
    return 'LS';
  }

  return null; // 알 수 없는 모델
}

/**
 * 3게이트 검증
 * (1) 메인 차단기, (2) 분기 차단기, (3) 부속자재 모두 충족 필요
 */
export function validate3Gates(request: EstimateRequest): void {
  const gates: string[] = [];

  // 게이트 1: 메인 차단기
  if (!request.main.model && !request.main.af) {
    gates.push('main.model 또는 main.af');
  }
  if (!request.main.poles) {
    gates.push('main.poles');
  }

  // 게이트 2: 분기 차단기
  if (!request.branches || request.branches.length === 0) {
    gates.push('branches[] 배열');
  } else {
    request.branches.forEach((branch, index) => {
      if (!branch.model && !branch.af) {
        gates.push(`branches[${index}].model 또는 branches[${index}].af`);
      }
      if (!branch.poles) {
        gates.push(`branches[${index}].poles`);
      }
      if (!branch.qty || branch.qty < 1) {
        gates.push(`branches[${index}].qty`);
      }
    });
  }

  // 게이트 3: 부속자재
  if (request.accessories.enabled === undefined) {
    gates.push('accessories.enabled');
  } else if (request.accessories.enabled && (!request.accessories.items || request.accessories.items.length === 0)) {
    gates.push('accessories.items[] (enabled=true일 때)');
  }

  if (gates.length > 0) {
    const gateNumber = gates[0].startsWith('main') ? 1 :
                      gates[0].startsWith('branches') ? 2 : 3;
    throw errors.gateMissing(gateNumber, gates);
  }
}

/**
 * 디바이스 타입과 모델 시리즈 일치 검증
 */
export function validateDeviceType(request: EstimateRequest): void {
  const { device, main, branches } = request;

  // 메인 차단기 검증
  if (main.model) {
    validateModelDeviceType(main.model, device.type, 'main.model');
  }

  // 분기 차단기 검증
  branches.forEach((branch, index) => {
    if (branch.model) {
      validateModelDeviceType(branch.model, device.type, `branches[${index}].model`);
    }
  });
}

/**
 * 개별 모델의 디바이스 타입 검증
 */
function validateModelDeviceType(model: string, expectedType: DeviceType, _path: string): void {
  const upperModel = model.toUpperCase();
  let actualType: DeviceType;

  // SANGDO 계열
  if (upperModel.startsWith('SBS') || upperModel.startsWith('SBE')) {
    actualType = 'MCCB';
  } else if (upperModel.startsWith('SES') || upperModel.startsWith('SEE')) {
    actualType = 'ELCB';
  }
  // LS 계열 (METASOL은 일반적으로 MCCB)
  else if (upperModel.includes('METASOL')) {
    actualType = 'MCCB';
  } else {
    // 알 수 없는 모델은 skip
    return;
  }

  if (actualType !== expectedType) {
    throw errors.deviceTypeMismatch(model, actualType, expectedType);
  }
}

/**
 * 극수 일치 검증
 */
export function validatePoles(request: EstimateRequest): void {
  const { brand, main, branches } = request;

  // 메인 차단기 극수 검증
  if (main.model && main.poles) {
    validateModelPoles(brand, main.model, main.poles, 'main.poles');
  }

  // 분기 차단기 극수 검증
  branches.forEach((branch, index) => {
    if (branch.model && branch.poles) {
      validateModelPoles(brand, branch.model, branch.poles, `branches[${index}].poles`);
    }
  });
}

/**
 * 개별 모델의 극수 검증
 */
function validateModelPoles(brand: string, model: string, poles: string, _path: string): void {
  // 치수표에서 해당 모델의 극수 확인
  const dimensions = getSize(brand, model, undefined, poles);

  if (!dimensions) {
    // 치수표에 없는 경우 ABSTAIN (size-tables.ts에서 처리됨)
    return;
  }

  // 극수가 일치하는지 확인
  if (dimensions.poles !== poles) {
    throw errors.polesMismatch(model, dimensions.poles, poles);
  }
}

/**
 * 경제형 기본 원칙 검증
 * 도면에 표준형 명시가 없으면 ECONOMIC이어야 함
 */
export function validateEconomicDefault(request: EstimateRequest): void {
  // 이 검증은 실제로는 도면 분석이 필요하므로
  // 현재는 경고만 생성 (실제 구현에서는 도면 파싱 필요)

  if (request.form === 'STANDARD') {
    // 도면에서 표준형이 명시되었는지 확인하는 로직이 필요
    // 현재는 사용자가 명시적으로 STANDARD를 선택했다고 가정
    console.warn('STANDARD form selected. Ensure drawing explicitly specifies standard form.');
  }
}

/**
 * 모델 존재성 검증 (치수표 기반)
 */
export function validateModelExists(brand: string, model: string): boolean {
  const availableModels = getAvailableModels(brand);

  // ELCB 매핑 고려 (SANGDO)
  if (brand === 'SANGDO') {
    // SES, SEE 모델은 SBS, SBE와 치수가 동일하므로 존재한다고 간주
    if (model.startsWith('SES')) {
      const sbsModel = model.replace('SES', 'SBS');
      return availableModels.includes(sbsModel);
    }
    if (model.startsWith('SEE')) {
      const sbeModel = model.replace('SEE', 'SBE');
      return availableModels.includes(sbeModel);
    }
  }

  return availableModels.includes(model);
}

/**
 * 전체 브랜드 규칙 검증
 */
export function validateBrandRules(request: EstimateRequest): void {
  // 1. 단일 브랜드 원칙
  validateSingleBrand(request);

  // 2. 3게이트 검증
  validate3Gates(request);

  // 3. 디바이스 타입 일치
  validateDeviceType(request);

  // 4. 극수 일치
  validatePoles(request);

  // 5. 경제형 기본 원칙
  validateEconomicDefault(request);
}