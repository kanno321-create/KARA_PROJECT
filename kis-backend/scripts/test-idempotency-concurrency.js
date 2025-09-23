#!/usr/bin/env node

/**
 * 📦 Idempotency & Concurrency Test Script
 *
 * Tests concurrent requests with same idempotency key to ensure:
 * 1. Only first request processes
 * 2. Subsequent requests return cached result
 * 3. No duplicate estimates created
 * 4. Response consistency across all requests
 */

import { setTimeout } from 'timers/promises';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'test-api-key-123';

// 테스트용 견적 요청 데이터
const TEST_REQUEST = {
  brand: 'LS',
  form: 'ECONOMIC',
  installation: { location: 'INDOOR', mount: 'WALL' },
  device: { type: 'MCCB' },
  main: { model: 'METASOL-250', af: 250, poles: '3P' },
  branches: [
    { model: 'METASOL-100', af: 100, poles: '3P', qty: 2 }
  ],
  accessories: { enabled: false, items: [] }
};

async function makeRequest(idempotencyKey, requestId) {
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}/v1/estimate/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(TEST_REQUEST)
    });

    const endTime = Date.now();
    const data = await response.json();

    return {
      requestId,
      status: response.status,
      responseTime: endTime - startTime,
      estimateId: data.estimateId,
      success: response.ok,
      body: data
    };
  } catch (error) {
    return {
      requestId,
      status: 'ERROR',
      responseTime: Date.now() - startTime,
      error: error.message,
      success: false
    };
  }
}

async function testIdempotencyConcurrency() {
  console.log('🧪 Starting Idempotency & Concurrency Test\n');

  // 고유 Idempotency Key 생성
  const idempotencyKey = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.log(`📋 Idempotency Key: ${idempotencyKey}\n`);

  // 동시에 5개 요청 발송
  const numRequests = 5;
  console.log(`🚀 Sending ${numRequests} concurrent requests...\n`);

  const promises = Array.from({ length: numRequests }, (_, i) =>
    makeRequest(idempotencyKey, `req-${i + 1}`)
  );

  const results = await Promise.all(promises);

  // 결과 분석
  console.log('📊 Results Analysis:\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\n❌ Failed Requests:');
    failed.forEach(result => {
      console.log(`  ${result.requestId}: ${result.error || result.status}`);
    });
  }

  // 중요: 모든 성공한 요청이 같은 estimateId를 반환해야 함
  const uniqueEstimateIds = new Set(successful.map(r => r.estimateId));

  console.log(`\n🔍 Idempotency Check:`);
  console.log(`  Unique Estimate IDs: ${uniqueEstimateIds.size}`);
  console.log(`  Expected: 1 (same ID for all requests)`);

  if (uniqueEstimateIds.size === 1) {
    console.log(`✅ PASS: All requests returned same estimate ID`);
  } else {
    console.log(`❌ FAIL: Multiple estimate IDs found`);
    console.log(`  IDs: ${Array.from(uniqueEstimateIds).join(', ')}`);
  }

  // 응답 시간 분석
  const responseTimes = successful.map(r => r.responseTime);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);

  console.log(`\n⏱️  Response Time Analysis:`);
  console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`  Min: ${minResponseTime}ms`);
  console.log(`  Max: ${maxResponseTime}ms`);

  // 상세 결과 출력
  console.log(`\n📋 Detailed Results:`);
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${result.requestId}: ${result.responseTime}ms - ${result.estimateId || result.error}`);
  });

  // 최종 판정
  const testPassed = successful.length >= numRequests * 0.8 && uniqueEstimateIds.size === 1;

  console.log(`\n🎯 Final Result: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);

  if (!testPassed) {
    process.exit(1);
  }
}

// 테스트 실행
testIdempotencyConcurrency().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});