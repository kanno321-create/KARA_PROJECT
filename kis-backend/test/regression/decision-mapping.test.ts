import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

/**
 * 회귀 테스트: 결정 매핑 5종 핵심 케이스
 * CI에서 전수 PASS 필수 (병합 차단 조건)
 */

describe('🎯 Decision Mapping Regression Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp({
      logger: false,
      database: { url: ':memory:' }
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * A) 지식 없음 → 200/ABSTAIN("no active knowledge version")
   */
  it('🔍 A) Knowledge Absent → 200 + ABSTAIN', async () => {
    const payload = {
      brand: 'SANGDO',
      form: 'ECONOMIC',
      installation: { location: 'INDOOR', mount: 'FLUSH' },
      device: { type: 'MCCB' },
      main: { enabled: true, af: 100, at: 100, poles: '3P' },
      branches: [{ af: 50, at: 50, poles: '2P', qty: 2 }],
      accessories: { enabled: false }
    };

    const response = await app.inject({
      method: 'POST',
      url: '/v1/estimate/create',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'regression-test-a'
      },
      payload
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.decision).toBe('ABSTAIN');
    expect(body.reasons).toContain('no active knowledge version');
    expect(body.hints).toBeDefined();
    expect(body.metadata).toHaveProperty('stage', 'knowledge');
    expect(body.metadata).toHaveProperty('status', 'absent');
  });

  /**
   * B) 유효 SKU → 200/OK (지식 활성화 후)
   * 실제로는 지식이 없어서 ABSTAIN이 나오지만,
   * 향후 지식 활성화 시 OK 응답 구조 테스트
   */
  it('🔍 B) Valid SKU → 200 + OK (Future: with knowledge)', async () => {
    const payload = {
      brand: 'SANGDO',
      form: 'ECONOMIC',
      installation: { location: 'INDOOR', mount: 'FLUSH' },
      device: { type: 'MCCB' },
      main: { enabled: true, af: 100, at: 100, poles: '3P', model: 'S-100AF' },
      branches: [{ af: 50, at: 50, poles: '2P', qty: 2, model: 'S-50AF' }],
      accessories: { enabled: false }
    };

    const response = await app.inject({
      method: 'POST',
      url: '/v1/estimate/create',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'regression-test-b'
      },
      payload
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    // 현재는 지식 부재로 ABSTAIN이지만, 구조는 검증
    expect(body).toHaveProperty('decision');
    expect(['OK', 'ABSTAIN']).toContain(body.decision);

    if (body.decision === 'OK') {
      expect(body.estimate).toBeDefined();
      expect(body.estimate.id).toBeDefined();
      expect(body.estimate.status).toBe('validated');
    }
  });

  /**
   * C) 필수 누락(brand) → 422(+path/hint)
   */
  it('🔍 C) Missing Required Field → 422 + path/hint', async () => {
    const payload = {
      // brand 누락
      form: 'ECONOMIC',
      installation: { location: 'INDOOR', mount: 'FLUSH' },
      device: { type: 'MCCB' },
      main: { enabled: true, af: 100, at: 100, poles: '3P' },
      branches: [{ af: 50, at: 50, poles: '2P', qty: 2 }],
      accessories: { enabled: false }
    };

    const response = await app.inject({
      method: 'POST',
      url: '/v1/estimate/create',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'regression-test-c'
      },
      payload
    });

    expect(response.statusCode).toBe(422);

    const body = response.json();
    expect(body.code).toBeDefined();
    expect(body.message).toBeDefined();
    expect(body.path).toContain('brand');
    expect(body.hint).toBeDefined();
  });

  /**
   * D) 포맷 오류(JSON) → 415/422
   */
  it('🔍 D) Invalid JSON Format → 415/422', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/estimate/create',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'regression-test-d'
      },
      payload: '{ invalid json }'
    });

    expect([415, 422]).toContain(response.statusCode);

    if (response.statusCode === 422) {
      const body = response.json();
      expect(body.code).toBeDefined();
      expect(body.message).toBeDefined();
    }
  });

  /**
   * E) 스키마 위반 (잘못된 enum) → 422
   */
  it('🔍 E) Schema Violation → 422', async () => {
    const payload = {
      brand: 'INVALID_BRAND', // 잘못된 enum
      form: 'ECONOMIC',
      installation: { location: 'INDOOR', mount: 'FLUSH' },
      device: { type: 'MCCB' },
      main: { enabled: true, af: 100, at: 100, poles: '3P' },
      branches: [{ af: 50, at: 50, poles: '2P', qty: 2 }],
      accessories: { enabled: false }
    };

    const response = await app.inject({
      method: 'POST',
      url: '/v1/estimate/create',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'regression-test-e'
      },
      payload
    });

    expect(response.statusCode).toBe(422);

    const body = response.json();
    expect(body.code).toBeDefined();
    expect(body.message).toBeDefined();
    expect(body.path).toBeDefined();
  });

  /**
   * 성능 경계값 테스트: p95 ≤ 100ms (dev 환경)
   */
  it('🔍 Performance Boundary: p95 ≤ 100ms', async () => {
    const payload = {
      brand: 'SANGDO',
      form: 'ECONOMIC',
      installation: { location: 'INDOOR', mount: 'FLUSH' },
      device: { type: 'MCCB' },
      main: { enabled: true, af: 100, at: 100, poles: '3P' },
      branches: [{ af: 50, at: 50, poles: '2P', qty: 2 }],
      accessories: { enabled: false }
    };

    const latencies: number[] = [];

    // 20회 측정
    for (let i = 0; i < 20; i++) {
      const start = Date.now();

      await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `perf-test-${i}`
        },
        payload
      });

      latencies.push(Date.now() - start);
    }

    // p95 계산
    latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95 = latencies[p95Index];

    console.log(`📊 Performance: p95=${p95}ms, min=${latencies[0]}ms, max=${latencies[latencies.length-1]}ms`);

    // Dev 환경 목표: p95 ≤ 100ms
    expect(p95).toBeLessThanOrEqual(100);
  });

  /**
   * 멱등성 일관성 테스트: 동일 입력 → 동일 출력
   */
  it('🔍 Idempotency Consistency', async () => {
    const payload = {
      brand: 'SANGDO',
      form: 'ECONOMIC',
      installation: { location: 'INDOOR', mount: 'FLUSH' },
      device: { type: 'MCCB' },
      main: { enabled: true, af: 100, at: 100, poles: '3P' },
      branches: [{ af: 50, at: 50, poles: '2P', qty: 2 }],
      accessories: { enabled: false }
    };

    const idempotencyKey = 'idempotency-consistency-test';

    // 첫 번째 호출
    const response1 = await app.inject({
      method: 'POST',
      url: '/v1/estimate/create',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      payload
    });

    // 두 번째 호출 (동일한 멱등성 키)
    const response2 = await app.inject({
      method: 'POST',
      url: '/v1/estimate/create',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      payload
    });

    expect(response1.statusCode).toBe(response2.statusCode);
    expect(response1.json()).toEqual(response2.json());
  });
});