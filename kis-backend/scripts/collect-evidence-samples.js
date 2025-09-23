#!/usr/bin/env node

/**
 * 📦 Evidence Sample Collection Script
 *
 * Collects Evidence samples before/after knowledge activation:
 * 1. Create estimates with current knowledge version
 * 2. Collect evidence packages
 * 3. Verify evidence integrity (signatures, hashes)
 * 4. Compare evidence consistency across versions
 */

import fs from 'fs';
import path from 'path';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'test-api-key-123';

// 다양한 견적 시나리오
const TEST_SCENARIOS = [
  {
    name: 'LS_Standard_3P',
    request: {
      brand: 'LS',
      form: 'STANDARD',
      installation: { location: 'INDOOR', mount: 'WALL' },
      device: { type: 'MCCB' },
      main: { model: 'METASOL-250', af: 250, poles: '3P' },
      branches: [
        { model: 'METASOL-100', af: 100, poles: '3P', qty: 2 },
        { model: 'METASOL-60', af: 60, poles: '2P', qty: 1 }
      ],
      accessories: { enabled: false, items: [] }
    }
  },
  {
    name: 'SANGDO_Economic_Mixed',
    request: {
      brand: 'SANGDO',
      form: 'ECONOMIC',
      installation: { location: 'OUTDOOR', mount: 'POLE' },
      device: { type: 'MCCB' },
      main: { model: 'SD-200', af: 200, poles: '3P' },
      branches: [
        { model: 'SD-100', af: 100, poles: '3P', qty: 1 },
        { model: 'SD-60', af: 60, poles: '2P', qty: 3 }
      ],
      accessories: { enabled: true, items: [{ type: 'SURGE_PROTECTOR', qty: 1 }] }
    }
  },
  {
    name: 'Mixed_Brand_Complex',
    request: {
      brand: 'MIXED',
      form: 'STANDARD',
      installation: { location: 'INDOOR', mount: 'WALL' },
      device: { type: 'MCCB' },
      main: { model: 'METASOL-400', af: 400, poles: '4P' },
      branches: [
        { model: 'METASOL-225', af: 225, poles: '3P', qty: 1 },
        { model: 'SD-100', af: 100, poles: '3P', qty: 2 },
        { model: 'SD-60', af: 60, poles: '2P', qty: 2 }
      ],
      accessories: { enabled: true, items: [
        { type: 'AUXILIARY_CONTACT', qty: 2 },
        { type: 'SHUNT_TRIP', qty: 1 }
      ]}
    }
  }
];

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

async function collectEvidenceSample(scenario) {
  console.log(`📋 Collecting evidence for scenario: ${scenario.name}`);

  try {
    // 견적 생성
    const estimateResult = await makeApiRequest('/v1/estimate/create', 'POST', scenario.request);
    const estimateId = estimateResult.data.estimateId;

    // Evidence 조회
    const evidenceResult = await makeApiRequest(`/v1/evidence/${estimateId}`);
    const evidence = evidenceResult.data;

    // Evidence 요약
    const summary = {
      scenario: scenario.name,
      estimateId,
      timestamp: new Date().toISOString(),
      knowledgeVersion: evidence.knowledgeVersion,
      rulesVersion: evidence.rulesVersion,
      snapshotHash: evidence.snapshotHash,
      signature: evidence.signature,
      tablesUsed: evidence.tables.length,
      totalRowsUsed: evidence.tables.reduce((sum, table) => sum + table.rows.length, 0),
      brandPolicy: evidence.brandPolicy,
      tableHashes: Object.keys(evidence.tableHashes).length
    };

    console.log(`   ✅ Evidence collected for estimate ${estimateId}`);
    console.log(`   📊 Knowledge version: ${summary.knowledgeVersion}`);
    console.log(`   🏷️  Tables used: ${summary.tablesUsed}`);
    console.log(`   📝 Total rows: ${summary.totalRowsUsed}`);

    return {
      summary,
      fullEvidence: evidence,
      estimateResult: estimateResult.data
    };

  } catch (error) {
    console.log(`   ❌ Failed to collect evidence: ${error.message}`);
    return {
      summary: {
        scenario: scenario.name,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      fullEvidence: null,
      estimateResult: null
    };
  }
}

async function verifyEvidenceIntegrity(evidenceSample) {
  if (!evidenceSample.fullEvidence) {
    return { valid: false, reason: 'No evidence data' };
  }

  const evidence = evidenceSample.fullEvidence;

  // 기본 필드 존재 확인
  const requiredFields = ['estimateId', 'snapshotHash', 'signature', 'rulesVersion', 'knowledgeVersion'];
  const missingFields = requiredFields.filter(field => !evidence[field]);

  if (missingFields.length > 0) {
    return { valid: false, reason: `Missing fields: ${missingFields.join(', ')}` };
  }

  // 서명 검증 API 호출
  try {
    const verifyResult = await makeApiRequest('/v1/evidence/verify', 'POST', {
      evidence: evidence
    });

    return {
      valid: verifyResult.data.valid,
      reason: verifyResult.data.valid ? 'Signature valid' : 'Signature invalid',
      details: verifyResult.data
    };
  } catch (error) {
    return { valid: false, reason: `Verification failed: ${error.message}` };
  }
}

async function collectAllEvidenceSamples() {
  console.log('🧪 Starting Evidence Sample Collection\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(process.cwd(), 'evidence-samples', timestamp);

  // 출력 디렉토리 생성
  if (!fs.existsSync('evidence-samples')) {
    fs.mkdirSync('evidence-samples');
  }
  fs.mkdirSync(outputDir, { recursive: true });

  // 현재 활성 버전 확인
  console.log('📋 Current knowledge version:');
  try {
    const { data: activeVersion } = await makeApiRequest('/v1/knowledge/versions/active');
    console.log(`   Active version: ${activeVersion?.label || 'none'}\n`);
  } catch (error) {
    console.log(`   ❌ Failed to get active version: ${error.message}\n`);
  }

  const results = {
    timestamp,
    activeVersion: null,
    samples: [],
    summary: {
      total: TEST_SCENARIOS.length,
      successful: 0,
      failed: 0,
      integrityPassed: 0,
      integrityFailed: 0
    }
  };

  // 각 시나리오별 Evidence 수집
  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n${TEST_SCENARIOS.indexOf(scenario) + 1}/${TEST_SCENARIOS.length} Processing ${scenario.name}...`);

    const evidenceSample = await collectEvidenceSample(scenario);

    if (evidenceSample.fullEvidence) {
      results.summary.successful++;

      // Evidence 무결성 검증
      console.log(`   🔍 Verifying evidence integrity...`);
      const integrityCheck = await verifyEvidenceIntegrity(evidenceSample);

      evidenceSample.integrityCheck = integrityCheck;

      if (integrityCheck.valid) {
        console.log(`   ✅ Evidence integrity: VALID`);
        results.summary.integrityPassed++;
      } else {
        console.log(`   ❌ Evidence integrity: INVALID (${integrityCheck.reason})`);
        results.summary.integrityFailed++;
      }
    } else {
      results.summary.failed++;
    }

    results.samples.push(evidenceSample);

    // 개별 샘플 파일 저장
    const sampleFile = path.join(outputDir, `${scenario.name}.json`);
    fs.writeFileSync(sampleFile, JSON.stringify(evidenceSample, null, 2));
  }

  // 전체 결과 요약 저장
  const summaryFile = path.join(outputDir, 'summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));

  // 결과 출력
  console.log('\n📊 Evidence Collection Summary:');
  console.log(`   📁 Output directory: ${outputDir}`);
  console.log(`   ✅ Successful: ${results.summary.successful}/${results.summary.total}`);
  console.log(`   ❌ Failed: ${results.summary.failed}/${results.summary.total}`);
  console.log(`   🔒 Integrity passed: ${results.summary.integrityPassed}/${results.summary.successful}`);
  console.log(`   ⚠️  Integrity failed: ${results.summary.integrityFailed}/${results.summary.successful}`);

  // 성공률 체크
  const successRate = (results.summary.successful / results.summary.total) * 100;
  const integrityRate = results.summary.successful > 0
    ? (results.summary.integrityPassed / results.summary.successful) * 100
    : 0;

  console.log(`\n🎯 Success rates:`);
  console.log(`   Collection: ${successRate.toFixed(1)}%`);
  console.log(`   Integrity: ${integrityRate.toFixed(1)}%`);

  if (successRate < 80 || integrityRate < 90) {
    console.log('\n❌ Evidence collection test FAILED');
    process.exit(1);
  }

  console.log('\n✅ Evidence collection test PASSED');
  return results;
}

// 테스트 실행
collectAllEvidenceSamples().catch(error => {
  console.error('❌ Evidence collection failed with error:', error);
  process.exit(1);
});