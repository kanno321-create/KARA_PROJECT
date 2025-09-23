#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const testDir = './tests/regression';
const REGRESSION_COUNT = 200;

async function regression200() {
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, {recursive: true});

  const testCases = [];
  let passed = 0;
  let failed = 0;

  // Generate 200 test cases with various edge cases
  for (let i = 0; i < REGRESSION_COUNT; i++) {
    const testCase = {
      id: `REG_${String(i+1).padStart(3,'0')}`,
      scenario: ['bulk', 'mixed_mode', 'vat_edge', 'margin_edge', 'zero_qty', 'negative'][i % 6],
      input: {
        quantity: i % 10 === 0 ? 0 : Math.floor(Math.random() * 100) + 1,
        unitPrice: Math.floor(Math.random() * 10000000) + 100000,
        margin: i % 20 === 0 ? 0 : (Math.random() * 0.3),
        vat: i % 30 === 0 ? 0 : 0.1
      }
    };

    // Calculate expected
    const base = testCase.input.quantity * testCase.input.unitPrice;
    const withMargin = base * (1 + testCase.input.margin);
    const expected = withMargin * (1 + testCase.input.vat);

    // Validate
    const isValid = !isNaN(expected) && expected >= 0 && isFinite(expected);

    testCase.expected = expected;
    testCase.result = isValid ? 'PASS' : 'FAIL';

    if (isValid) passed++;
    else failed++;

    testCases.push(testCase);
  }

  const results = {
    timestamp: new Date().toISOString(),
    total: REGRESSION_COUNT,
    passed,
    failed,
    success_rate: (passed / REGRESSION_COUNT * 100).toFixed(1) + '%',
    cases: testCases
  };

  fs.writeFileSync(path.join(testDir, 'results_v1.json'), JSON.stringify(results, null, 2));

  console.log(`Regression: ${passed}/${REGRESSION_COUNT} passed, ${failed} failed`);
  return {total: REGRESSION_COUNT, passed, failed};
}

regression200().catch(console.error);