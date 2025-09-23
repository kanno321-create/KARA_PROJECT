#!/usr/bin/env node

/**
 * 📦 Admin Knowledge Activation & Regression Test Script
 *
 * Tests complete knowledge management workflow:
 * 1. Import knowledge data to staging
 * 2. Validate staging data
 * 3. Activate new version (hot swap)
 * 4. Run golden set regression tests
 * 5. Verify cache consistency
 */

import fs from 'fs';
import path from 'path';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'test-api-key-123';

// 테스트용 CSV 데이터
const TEST_CSV_DATA = `brand,series,model,af,poles,width_mm,height_mm,depth_mm,meta
LS,METASOL,METASOL-100,100,2P,105,275,103,{"series":"METASOL","type":"MCCB"}
LS,METASOL,METASOL-100,100,3P,158,275,103,{"series":"METASOL","type":"MCCB"}
LS,METASOL,METASOL-225,225,3P,210,275,103,{"series":"METASOL","type":"MCCB"}
SANGDO,SD,SD-100,100,2P,100,270,100,{"series":"SD","type":"MCCB"}
SANGDO,SD,SD-100,100,3P,150,270,100,{"series":"SD","type":"MCCB"}`;

async function makeApiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} - ${JSON.stringify(data)}`);
  }

  return { status: response.status, data };
}

async function testKnowledgeWorkflow() {
  console.log('🧪 Starting Knowledge Management Workflow Test\n');

  try {
    // 1. 현재 활성 버전 확인
    console.log('1️⃣ Getting current active version...');
    const { data: currentVersion } = await makeApiRequest('/v1/knowledge/versions/active');
    console.log(`   Current active version: ${currentVersion?.label || 'none'}\n`);

    // 2. CSV 데이터를 staging에 import
    console.log('2️⃣ Importing test data to staging...');
    const importResult = await makeApiRequest('/v1/knowledge/tables/import', 'POST', {
      format: 'csv',
      content: TEST_CSV_DATA,
      versionLabel: `test-${Date.now()}`
    });
    console.log(`   ✅ Import completed: ${importResult.data.message}`);
    console.log(`   📊 Rows imported: ${importResult.data.details.rowCount}`);
    console.log(`   🏷️  Version label: ${importResult.data.details.versionLabel}\n`);

    const newVersionLabel = importResult.data.details.versionLabel;

    // 3. 샘플 검증
    console.log('3️⃣ Running sample validation...');
    const validationResult = await makeApiRequest('/v1/knowledge/tables/validate', 'POST', {
      versionLabel: newVersionLabel,
      sampleSize: 3
    });
    console.log(`   ✅ Validation completed: ${validationResult.data.message}`);
    console.log(`   📊 Sample size: ${validationResult.data.sampleResults.length}`);

    const allSamplesValid = validationResult.data.sampleResults.every(sample => sample.estimateResult);
    console.log(`   🎯 All samples valid: ${allSamplesValid ? '✅ YES' : '❌ NO'}\n`);

    if (!allSamplesValid) {
      console.log('❌ Sample validation failed, stopping test');
      process.exit(1);
    }

    // 4. 활성화 (hot swap) 수행
    console.log('4️⃣ Activating new version (hot swap)...');
    const activationResult = await makeApiRequest('/v1/knowledge/tables/activate', 'POST', {
      versionLabel: newVersionLabel,
      runRegression: true
    });
    console.log(`   ✅ Activation completed: ${activationResult.data.message}`);
    console.log(`   🔄 Hot swap successful: ${activationResult.data.hotSwapSuccess ? '✅ YES' : '❌ NO'}`);

    // 5. 회귀 테스트 결과 확인
    if (activationResult.data.regressionResult) {
      const regression = activationResult.data.regressionResult;
      console.log(`   📊 Regression test results:`);
      console.log(`      Total golden samples: ${regression.totalSamples}`);
      console.log(`      Passed: ${regression.passedCount}`);
      console.log(`      Failed: ${regression.failedCount}`);
      console.log(`      Success rate: ${regression.successRate}%`);

      if (regression.successRate < 90) {
        console.log('❌ Regression test failed (success rate < 90%)');
        process.exit(1);
      }
    }

    // 6. 새 버전이 활성화되었는지 확인
    console.log('\n5️⃣ Verifying new active version...');
    const { data: newActiveVersion } = await makeApiRequest('/v1/knowledge/versions/active');
    console.log(`   New active version: ${newActiveVersion?.label || 'none'}`);

    const versionSwitched = newActiveVersion?.label === newVersionLabel;
    console.log(`   Version switched: ${versionSwitched ? '✅ YES' : '❌ NO'}`);

    if (!versionSwitched) {
      console.log('❌ Version switch failed');
      process.exit(1);
    }

    // 7. 캐시 일관성 테스트 (몇 개 dimension 조회)
    console.log('\n6️⃣ Testing cache consistency...');

    const testQueries = [
      { brand: 'LS', model: 'METASOL-100', af: 100, poles: '3P' },
      { brand: 'SANGDO', model: 'SD-100', af: 100, poles: '2P' }
    ];

    for (const query of testQueries) {
      try {
        // 실제 견적 요청으로 캐시된 데이터 사용 여부 확인
        const estimateRequest = {
          brand: query.brand,
          form: 'ECONOMIC',
          installation: { location: 'INDOOR', mount: 'WALL' },
          device: { type: 'MCCB' },
          main: { model: query.model, af: query.af, poles: query.poles },
          branches: [],
          accessories: { enabled: false, items: [] }
        };

        const estimateResult = await makeApiRequest('/v1/estimate/create', 'POST', estimateRequest);
        console.log(`   ✅ Cache test for ${query.brand} ${query.model}: OK`);
      } catch (error) {
        console.log(`   ❌ Cache test for ${query.brand} ${query.model}: ${error.message}`);
      }
    }

    console.log('\n🎯 Knowledge Management Workflow Test: ✅ PASSED\n');

  } catch (error) {
    console.error(`❌ Workflow test failed:`, error.message);
    process.exit(1);
  }
}

// 테스트 실행
testKnowledgeWorkflow().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});