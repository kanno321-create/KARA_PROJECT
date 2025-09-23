import { test, expect } from '@playwright/test';
import { loadTestFixtures, validateBundleResponse, validateWhyTrace } from '../utils/testUtils';
import { compareSnapshot, validateAllSnapshots } from '../utils/snapshotUtils';

/**
 * M2.8 회귀 테스트 스위트
 * 재현성 보장 및 변경사항 감지를 위한 스냅샷 기반 테스트
 */

test.describe('M2.8 재현성 회귀가드 테스트', () => {
  const fixtures = loadTestFixtures();

  test.beforeAll(async () => {
    // 스냅샷 상태 검증
    const snapshotStatus = validateAllSnapshots();
    console.log(`[M2.8 REGRESSION] Snapshot status:`, snapshotStatus);
  });

  test('단순 자석 견적 회귀 검증', async ({ page, request }) => {
    const scenario = fixtures.scenarios.simple_magnet;

    const response = await request.post('/api/estimate/bundle-bom', {
      data: scenario.request
    });

    expect(response.ok()).toBeTruthy();
    const bomResult = await response.json();

    // 기본 결과 검증
    validateBundleResponse(bomResult, scenario.expected);

    // 스냅샷 비교를 통한 회귀 검증
    const snapshotComparison = await compareSnapshot(bomResult, 'simple_magnet_regression');

    // 구조적 일치성은 반드시 유지되어야 함
    expect(snapshotComparison.structuralMatch).toBe(true);

    // 정확한 일치 여부 확인 (변경사항 감지)
    if (!snapshotComparison.exactMatch) {
      console.warn('[M2.8 REGRESSION] Changes detected in simple_magnet scenario:');
      snapshotComparison.differences.forEach(diff => {
        console.warn(`  ${diff.path}: ${diff.description}`);
      });

      // 변경사항이 예상된 것인지 검증
      const allowedChanges = ['enhanced_bom.meta.generated_at', 'enhanced_bom.meta.session_id'];
      const significantChanges = snapshotComparison.differences.filter(diff => 
        !allowedChanges.some(allowed => diff.path.includes(allowed))
      );

      // 중요한 변경사항이 있으면 실패
      expect(significantChanges).toHaveLength(0);
    }
  });

  test('복수 번들 규칙 회귀 검증', async ({ page, request }) => {
    const scenario = fixtures.scenarios.dual_bundle;

    const response = await request.post('/api/estimate/bundle-bom', {
      data: scenario.request
    });

    const bomResult = await response.json();
    validateBundleResponse(bomResult, scenario.expected);

    const snapshotComparison = await compareSnapshot(bomResult, 'dual_bundle_regression');
    expect(snapshotComparison.structuralMatch).toBe(true);

    // 복수 규칙 적용 결과의 일관성 검증
    const bundleStats = bomResult.bundle_statistics;
    expect(bundleStats.bundle_rules_applied).toHaveLength(2);
    expect(bundleStats.bundle_rules_applied).toContain('BND_MAGNET_BASE');
    expect(bundleStats.bundle_rules_applied).toContain('BND_TIMER_EFFECT');
  });

  test('전체 번들 규칙 회귀 검증', async ({ page, request }) => {
    const scenario = fixtures.scenarios.all_bundle_types;

    const response = await request.post('/api/estimate/bundle-bom', {
      data: scenario.request
    });

    const bomResult = await response.json();
    validateBundleResponse(bomResult, scenario.expected);

    const snapshotComparison = await compareSnapshot(bomResult, 'all_bundle_types_regression');
    expect(snapshotComparison.structuralMatch).toBe(true);

    // 모든 규칙의 일관된 적용 검증
    const expectedRules = ['BND_MAGNET_BASE', 'BND_TIMER_EFFECT', 'BND_SPD_COMPANION', 'BND_METER_COMPANION'];
    const appliedRules = bomResult.bundle_statistics.bundle_rules_applied;
    
    expect(appliedRules).toHaveLength(4);
    expectedRules.forEach(rule => {
      expect(appliedRules).toContain(rule);
    });
  });

  test('WhyTrace 이벤트 회귀 검증', async ({ page, request }) => {
    const scenario = fixtures.scenarios.dual_bundle;

    const response = await request.post('/api/estimate/bundle-bom', {
      data: scenario.request
    });

    const bomResult = await response.json();
    const whyTrace = bomResult.enhanced_bom.why_trace;

    // WhyTrace 구조 검증
    validateWhyTrace(whyTrace, scenario.expected.why_trace_events);

    // WhyTrace 이벤트 타입 분포 검증
    const eventTypes = {
      rule: whyTrace.filter((e: any) => e.rule.startsWith('RULE:')),
      qtyInfer: whyTrace.filter((e: any) => e.rule.startsWith('QTY_INFER:')),
      costAdd: whyTrace.filter((e: any) => e.rule.startsWith('COST_ADD:'))
    };

    // 일관된 이벤트 생성 검증
    expect(eventTypes.rule).toHaveLength(2); // 2개 규칙 적용
    expect(eventTypes.costAdd.filter((e: any) => e.rule.includes('LABOR'))).toHaveLength(2); // 2개 노동비 가산

    // WhyTrace 스냅샷 비교
    const whyTraceSnapshot = await compareSnapshot({ whyTrace }, 'why_trace_regression');
    expect(whyTraceSnapshot.structuralMatch).toBe(true);
  });

  test('가격 계산 회귀 검증', async ({ page, request }) => {
    const scenario = fixtures.scenarios.dual_bundle;

    const response = await request.post('/api/estimate/bundle-bom', {
      data: scenario.request
    });

    const bomResult = await response.json();
    const costBreakdown = bomResult.cost_breakdown;

    // 가격 구성 요소 검증
    const materialCost = parseFloat(costBreakdown.material_cost);
    const laborCost = parseFloat(costBreakdown.labor_cost);
    const totalCost = parseFloat(costBreakdown.total_cost);

    // 기본 가격 검증
    expect(materialCost).toBeGreaterThan(0);
    expect(laborCost).toBeGreaterThan(0);
    expect(totalCost).toBe(materialCost + laborCost);

    // 번들 노동비 가산 검증 (MAGNET 20,000원 + TIMER 15,000원)
    expect(laborCost).toBeGreaterThanOrEqual(35000);

    // 가격 정확성 스냅샷 비교
    const pricingSnapshot = await compareSnapshot({ costBreakdown }, 'pricing_regression');
    expect(pricingSnapshot.structuralMatch).toBe(true);

    // 가격 변동이 감지되면 경고
    if (!pricingSnapshot.exactMatch) {
      console.warn('[M2.8 REGRESSION] Pricing changes detected - review required');
    }
  });

  test('SOT 데이터 무결성 회귀 검증', async ({ page, request }) => {
    // SOT 정보 조회
    const sotResponse = await request.get('/api/estimate/sot-info');
    expect(sotResponse.ok()).toBeTruthy();
    const sotInfo = await sotResponse.json();

    // SOT 데이터 구조 검증
    expect(sotInfo.version_info).toBeDefined();
    expect(sotInfo.bundle_engine).toBeDefined();
    expect(sotInfo.data_integrity).toBeDefined();

    // 번들 규칙 수량 검증
    expect(sotInfo.bundle_engine.rules_available).toBe(4);

    // 데이터 무결성 검증
    expect(sotInfo.data_integrity.validated).toBe(true);

    // SOT 구성 스냅샷 비교
    const sotSnapshot = await compareSnapshot(sotInfo, 'sot_integrity_regression');
    expect(sotSnapshot.structuralMatch).toBe(true);

    // SOT 변경이 감지되면 중요한 변경사항
    if (!sotSnapshot.exactMatch) {
      console.error('[M2.8 REGRESSION] SOT data changes detected - CRITICAL');
      throw new Error('SOT data integrity compromised');
    }
  });

  test('번들 아이템 구조 회귀 검증', async ({ page, request }) => {
    const scenario = fixtures.scenarios.all_bundle_types;

    const response = await request.post('/api/estimate/bundle-bom', {
      data: scenario.request
    });

    const bomResult = await response.json();
    const bundleItems = bomResult.enhanced_bom.items.filter((item: any) => item.bundle_flag === true);

    // 번들 아이템 필수 필드 검증
    bundleItems.forEach((item: any) => {
      expect(item.bundle_flag).toBe(true);
      expect(item.parent_item_id).toBeDefined();
      expect(item.rule_id).toBeDefined();
      expect(item.code).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.qty).toBeGreaterThan(0);
      expect(item.unit_price).toBeGreaterThan(0);
      expect(item.total_price).toBe(item.unit_price * item.qty);
    });

    // 번들 구조 스냅샷 비교
    const structureSnapshot = await compareSnapshot({ bundleItems }, 'bundle_structure_regression');
    expect(structureSnapshot.structuralMatch).toBe(true);
  });

  test('오류 시나리오 회귀 검증', async ({ page, request }) => {
    // 잘못된 카테고리 테스트
    const invalidRequest = {
      items: [{
        id: 'item_1',
        code: 'INVALID-ITEM',
        name: 'Invalid Item',
        category: 'invalid_category',
        qty: 1,
        unit: 'EA',
        unit_price: 1000,
        total_price: 1000
      }],
      project_info: { project_name: 'Regression Invalid Test' },
      options: {}
    };

    const response = await request.post('/api/estimate/bundle-bom', {
      data: invalidRequest
    });

    expect(response.ok()).toBeTruthy();
    const bomResult = await response.json();

    // 번들 규칙이 적용되지 않아야 함
    expect(bomResult.bundle_statistics.bundle_items_added).toBe(0);
    expect(bomResult.bundle_statistics.bundle_rules_applied).toHaveLength(0);

    // 오류 처리 일관성 검증
    const errorSnapshot = await compareSnapshot(bomResult, 'error_handling_regression');
    expect(errorSnapshot.structuralMatch).toBe(true);
  });

  test('대량 데이터 처리 회귀 검증', async ({ page, request }) => {
    const scenario = fixtures.scenarios.performance_stress;

    const response = await request.post('/api/estimate/bundle-bom', {
      data: scenario.request
    });

    const bomResult = await response.json();

    // 대량 처리 결과 일관성 검증
    expect(bomResult.bundle_statistics.original_items_count).toBe(2);
    expect(bomResult.bundle_statistics.bundle_items_added).toBe(90); // 15개 * 6번
    expect(bomResult.bundle_statistics.total_items_count).toBe(92);

    // 대량 처리 스냅샷 비교
    const stressSnapshot = await compareSnapshot(bomResult, 'stress_test_regression');
    expect(stressSnapshot.structuralMatch).toBe(true);

    // 대량 처리시에도 결과 일관성 유지
    if (!stressSnapshot.exactMatch) {
      console.warn('[M2.8 REGRESSION] Stress test results changed - performance impact review needed');
    }
  });

  test('연속 처리 회귀 검증 - 상태 초기화', async ({ page, request }) => {
    const scenario = fixtures.scenarios.simple_magnet;
    const results = [];

    // 5번 연속 처리로 상태 초기화 검증
    for (let i = 0; i < 5; i++) {
      const response = await request.post('/api/estimate/bundle-bom', {
        data: scenario.request
      });

      const bomResult = await response.json();
      results.push(bomResult);

      // 각 결과가 동일해야 함 (상태 오염 없음)
      expect(bomResult.bundle_statistics.original_items_count).toBe(1);
      expect(bomResult.bundle_statistics.bundle_items_added).toBe(4);
      expect(bomResult.bundle_statistics.bundle_rules_applied).toContain('BND_MAGNET_BASE');
    }

    // 모든 결과가 일관성 있는지 검증
    const firstResult = results[0];
    results.forEach((result, index) => {
      expect(result.bundle_statistics.original_items_count).toBe(firstResult.bundle_statistics.original_items_count);
      expect(result.bundle_statistics.bundle_items_added).toBe(firstResult.bundle_statistics.bundle_items_added);
      expect(result.bundle_statistics.bundle_rules_applied).toEqual(firstResult.bundle_statistics.bundle_rules_applied);
    });

    console.log('[M2.8 REGRESSION] Sequential processing consistency: ✅');
  });
});

test.describe('M2.8 스냅샷 관리 테스트', () => {
  test('스냅샷 생성 및 업데이트 검증', async ({ page, request }) => {
    const scenario = fixtures.scenarios.simple_magnet;

    const response = await request.post('/api/estimate/bundle-bom', {
      data: scenario.request
    });

    const bomResult = await response.json();

    // 새 스냅샷 생성 테스트
    const comparison = await compareSnapshot(bomResult, 'snapshot_creation_test');
    expect(comparison.metadata.current).toBeDefined();
    expect(comparison.metadata.current.checksum).toBeDefined();

    console.log('[M2.8 REGRESSION] Snapshot creation: ✅');
  });

  test('스냅샷 검증 전체 상태 확인', async () => {
    const snapshotStatus = validateAllSnapshots();
    
    expect(snapshotStatus.total).toBeGreaterThan(0);
    expect(snapshotStatus.valid).toBeGreaterThanOrEqual(0);
    expect(snapshotStatus.outdated).toBeGreaterThanOrEqual(0);

    console.log(`[M2.8 REGRESSION] Snapshot validation: ${snapshotStatus.valid}/${snapshotStatus.total} valid`);
  });
});