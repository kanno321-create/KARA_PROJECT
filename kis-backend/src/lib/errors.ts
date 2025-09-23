import type { FastifyReply } from 'fastify';

// 에러 코드 정의
export enum ErrorCode {
  // 공통 에러
  REQ_MORE_INFO = 'REQ_MORE_INFO',
  INVALID_INPUT = 'INVALID_INPUT',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // 견적 특화 에러
  NEED_KNOWLEDGE_UPDATE = 'NEED_KNOWLEDGE_UPDATE',
  BRAND_CONFLICT = 'BRAND_CONFLICT',
  POLES_MISMATCH = 'POLES_MISMATCH',
  DEVICE_TYPE_MISMATCH = 'DEVICE_TYPE_MISMATCH',
  LOCATION_MISMATCH = 'LOCATION_MISMATCH',
  MOUNT_MISMATCH = 'MOUNT_MISMATCH',
  FORM_DEFAULT_OVERRIDE = 'FORM_DEFAULT_OVERRIDE',
  ACCESSORY_CONFLICT = 'ACCESSORY_CONFLICT',
  GATE_MISSING = 'GATE_MISSING',
}

// 에러 응답 포맷
export interface ErrorResponse {
  code: string;
  message: string;
  path?: string;
  hint?: string;
}

// 커스텀 에러 클래스
export class KISError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 400,
    public path?: string,
    public hint?: string
  ) {
    super(message);
    this.name = 'KISError';
  }

  toJSON(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
      ...(this.path && { path: this.path }),
      ...(this.hint && { hint: this.hint }),
    };
  }
}

// 에러 생성 헬퍼 함수들
export const errors = {
  // 422 Validation Errors
  reqMoreInfo: (path: string, message: string, hint?: string) =>
    new KISError(ErrorCode.REQ_MORE_INFO, message, 422, path, hint),

  needKnowledgeUpdate: (message: string, hint: string) =>
    new KISError(ErrorCode.NEED_KNOWLEDGE_UPDATE, message, 422, undefined, hint),

  brandConflict: (message: string, path = 'brand') =>
    new KISError(
      ErrorCode.BRAND_CONFLICT,
      message,
      422,
      path,
      '혼합 브랜드는 brand="MIXED"로 명시해 주세요.'
    ),

  polesMismatch: (model: string, expected: string, actual: string) =>
    new KISError(
      ErrorCode.POLES_MISMATCH,
      `${model} 모델은 ${expected}만 지원합니다. 입력된 값: ${actual}`,
      422,
      'poles',
      `올바른 극수로 수정해 주세요.`
    ),

  deviceTypeMismatch: (model: string, expectedType: string, actualType: string) =>
    new KISError(
      ErrorCode.DEVICE_TYPE_MISMATCH,
      `모델 ${model}은 ${expectedType} 계열입니다. 요청의 device.type: ${actualType}`,
      422,
      'device.type',
      `device.type을 ${expectedType}으로 수정해 주세요.`
    ),

  locationMismatch: (message: string) =>
    new KISError(
      ErrorCode.LOCATION_MISMATCH,
      message,
      422,
      'installation.location',
      'INDOOR 또는 OUTDOOR를 선택해 주세요.'
    ),

  mountMismatch: (message: string) =>
    new KISError(
      ErrorCode.MOUNT_MISMATCH,
      message,
      422,
      'installation.mount',
      'FLUSH(매입) 또는 SURFACE(노출)를 선택해 주세요.'
    ),

  formDefaultOverride: () =>
    new KISError(
      ErrorCode.FORM_DEFAULT_OVERRIDE,
      '도면에 표준형이 명시되었는데 ECONOMIC이 선택되었습니다.',
      422,
      'form',
      'form을 STANDARD로 변경하거나 도면을 확인해 주세요.'
    ),

  accessoryConflict: () =>
    new KISError(
      ErrorCode.ACCESSORY_CONFLICT,
      '부속자재가 비활성화되었는데 항목이 포함되었습니다.',
      422,
      'accessories',
      'enabled=false일 때는 items를 비워주세요.'
    ),

  gateMissing: (gateNumber: number, missingFields: string[]) =>
    new KISError(
      ErrorCode.GATE_MISSING,
      `입력 게이트 ${gateNumber} 미충족: ${missingFields.join(', ')} 필요`,
      422,
      missingFields[0],
      `게이트 ${gateNumber} 정보를 완성해 주세요.`
    ),

  // 400 Bad Request
  invalidInput: (message: string, path?: string) =>
    new KISError(ErrorCode.INVALID_INPUT, message, 400, path),

  // 404 Not Found
  notFound: (resource: string, id?: string) =>
    new KISError(
      ErrorCode.NOT_FOUND,
      `${resource}${id ? ` (${id})` : ''}을(를) 찾을 수 없습니다.`,
      404
    ),

  // 409 Conflict
  conflict: (message: string, hint?: string) =>
    new KISError(ErrorCode.CONFLICT, message, 409, undefined, hint),

  // 500 Internal Error
  internal: (message = '내부 서버 오류가 발생했습니다.') =>
    new KISError(ErrorCode.INTERNAL_ERROR, message, 500),
};

// Fastify 에러 핸들러
export async function errorHandler(
  error: Error,
  request: any,
  reply: FastifyReply
): Promise<void> {
  // KISError인 경우
  if (error instanceof KISError) {
    reply.status(error.statusCode).send(error.toJSON());
    return;
  }

  // 일반 에러인 경우
  console.error('Unhandled error:', error);
  reply.status(500).send({
    code: ErrorCode.INTERNAL_ERROR,
    message: process.env.NODE_ENV === 'development'
      ? error.message
      : '내부 서버 오류가 발생했습니다.',
  });
}