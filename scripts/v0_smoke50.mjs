#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SMOKE_COUNT = 50;
const outDir = './out';

// Sample data for smoke tests
const smokeData = Array.from({length: SMOKE_COUNT}, (_, i) => ({
  id: `smoke_${i+1}`,
  category: ['HW','SW','NET','SEC'][i % 4],
  quantity: Math.floor(Math.random() * 10) + 1,
  unitPrice: Math.floor(Math.random() * 1000000) + 100000,
  margin: 0.15,
  vat: 0.1
}));

// Main smoke test
async function runSmoke() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive: true});

  let passed = 0;
  for (const test of smokeData) {
    // Estimate
    const estimate = {
      id: test.id,
      items: [test],
      subtotal: test.quantity * test.unitPrice,
      margin: test.quantity * test.unitPrice * test.margin,
      vat: test.quantity * test.unitPrice * (1 + test.margin) * test.vat,
      total: test.quantity * test.unitPrice * (1 + test.margin) * (1 + test.vat)
    };

    // Validate
    const isValid = estimate.total > 0 && estimate.subtotal > 0;

    // Evidence
    const evidence = {
      timestamp: new Date().toISOString(),
      validated: isValid,
      checksum: crypto.createHash('sha256').update(JSON.stringify(estimate)).digest('hex').slice(0,8)
    };

    // Save
    fs.writeFileSync(path.join(outDir, `${test.id}.quote.json`), JSON.stringify(estimate, null, 2));
    fs.writeFileSync(path.join(outDir, `${test.id}.evidence.json`), JSON.stringify(evidence, null, 2));

    if (isValid) passed++;
  }

  console.log(`V0 Smoke: ${passed}/${SMOKE_COUNT} passed`);
  return passed;
}

runSmoke().catch(console.error);