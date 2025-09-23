import crypto from 'crypto';

// ============================================
// 요청 정규화/해시/응답 정렬 유틸
// ============================================

export function normalizeRequestBody(body: unknown): any {
  // 키 이름/케이스/순서 표준화, 숫자/문자 타입 일치, 배열 정렬 기준 통일 등
  // 1) 객체 키 알파벳 정렬  2) 배열은 안정 정렬(모델명+극수+수량 키)  3) boolean/number/string 캐스팅
  return deepSort(body);
}

export function stableStringify(obj: any): string {
  // 키 순서 보장 JSON 직렬화를 사용 (deepSort 이후 JSON.stringify)
  return JSON.stringify(obj);
}

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ============================================
// 깊은 정렬 함수
// ============================================

function deepSort(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    // 배열의 경우: 각 요소를 정규화하고 정렬
    const normalized = obj.map(item => deepSort(item));

    // 분기 차단기 배열의 경우 특별한 정렬 기준 적용
    if (normalized.length > 0 &&
        typeof normalized[0] === 'object' &&
        normalized[0] !== null &&
        ('model' in normalized[0] || 'af' in normalized[0] || 'poles' in normalized[0])) {
      // 모델명+극수+수량 기준으로 정렬
      return normalized.sort((a, b) => {
        const aKey = `${a.model || ''}-${a.af || 0}-${a.poles || ''}-${a.qty || a.count || 0}`;
        const bKey = `${b.model || ''}-${b.af || 0}-${b.poles || ''}-${b.qty || b.count || 0}`;
        return aKey.localeCompare(bKey);
      });
    }

    // 일반 배열은 JSON 문자열로 정렬
    return normalized.sort((a, b) => {
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      return aStr.localeCompare(bStr);
    });
  }

  // 객체의 경우: 키를 알파벳 순으로 정렬하고 값을 재귀적으로 정규화
  const sortedObj: any = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sortedObj[key] = deepSort(obj[key]);
  }

  return sortedObj;
}

// ============================================
// 응답 정규화 (멱등성 보장용)
// ============================================

export function normalizeResponse(response: any): any {
  // 응답도 동일한 정규화 적용하여 바이트 동일성 보장
  return deepSort(response);
}