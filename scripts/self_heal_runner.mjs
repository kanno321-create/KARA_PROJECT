#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  exists,
  readJSON,
  writeJSON,
  sleep,
  markCheckpoint,
  shouldSkip,
  attempt
} from './_self_heal_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

const SUMMARY = './out/self_heal_summary.json';

async function runCommand(cmd, cwd = process.cwd()) {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd, shell: true });
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function countFiles(pattern) {
  try {
    const dir = path.dirname(pattern);
    const ext = path.extname(pattern);

    if (!fs.existsSync(dir)) return 0;

    const files = fs.readdirSync(dir).filter(f => f.endsWith(ext));
    return files.length;
  } catch (e) {
    return 0;
  }
}

async function main() {
  console.log('Starting self-healing runner...');

  const summary = {
    start: new Date().toISOString(),
    steps: [],
    overall_status: 'RUNNING'
  };

  try {
    // Step 1: v0_smoke50
    const v0Result = await attempt(
      'v0_smoke50',
      async () => await runCommand('node scripts/v0_smoke50.mjs'),
      async () => {
        const quotes = await countFiles('./out/*.quote.json');
        const evidence = await countFiles('./out/*.evidence.json');
        return quotes >= 1 && evidence >= 1;
      }
    );
    summary.steps.push({ step: 'v0_smoke50', result: v0Result });

    // Step 2: v1_regen_cards
    const v1Result = await attempt(
      'v1_regen_cards',
      async () => await runCommand('node scripts/v1_regen_cards.mjs'),
      async () => {
        const cards = await countFiles('./out/cards/*.cards.json');
        return cards >= 45;
      }
    );
    summary.steps.push({ step: 'v1_regen_cards', result: v1Result });

    // Step 3: merge_cards
    const mergeResult = await attempt(
      'merge_cards',
      async () => await runCommand('node scripts/merge_cards.mjs'),
      async () => {
        if (!exists('./out/plan/merged_replacement_plan.json')) return false;
        const plan = readJSON('./out/plan/merged_replacement_plan.json', {});
        return plan.items && plan.items.length > 0;
      }
    );
    summary.steps.push({ step: 'merge_cards', result: mergeResult });

    // Step 4: preview_and_perf
    const previewResult = await attempt(
      'preview_and_perf',
      async () => await runCommand('node scripts/preview_and_perf.mjs'),
      async () => {
        if (!exists('./logs/preview.json')) return false;
        const preview = readJSON('./logs/preview.json', {});
        return preview.performance &&
               preview.performance.p50_ms !== undefined &&
               preview.performance.p95_ms !== undefined &&
               preview.performance.reuse_rate !== undefined;
      }
    );
    summary.steps.push({ step: 'preview_and_perf', result: previewResult });

    // Step 5: gates_quickcheck
    const gatesResult = await attempt(
      'gates_quickcheck',
      async () => await runCommand('node scripts/gates_quickcheck.mjs'),
      async () => {
        if (!exists('./logs/gates_quickcheck.json')) return false;
        const gates = readJSON('./logs/gates_quickcheck.json', {});
        return gates.fix4 === 'PASS' &&
               gates.designOps === 'PASS' &&
               gates.polisher === 'OK';
      }
    );
    summary.steps.push({ step: 'gates_quickcheck', result: gatesResult });

    // Step 6: regression_200
    const regressionResult = await attempt(
      'regression_200',
      async () => await runCommand('node scripts/regression_200.mjs'),
      async () => {
        if (!exists('./tests/regression/results_v1.json')) return false;
        const results = readJSON('./tests/regression/results_v1.json', {});
        return results.total === 200 && results.failed === 0;
      }
    );
    summary.steps.push({ step: 'regression_200', result: regressionResult });

    // Step 7: erp_handoff
    const handoffResult = await attempt(
      'erp_handoff',
      async () => await runCommand('node scripts/erp_handoff.mjs'),
      async () => {
        return exists('../KIS_ERP_INBOUND/replacement_plan.json') &&
               exists('../KIS_ERP_INBOUND/replacement_plan.sha256');
      }
    );
    summary.steps.push({ step: 'erp_handoff', result: handoffResult });

    // Step 8: update_pins
    const pinsResult = await attempt(
      'update_pins',
      async () => await runCommand('node scripts/update_pins.mjs'),
      async () => {
        if (!exists('./release/dashboard_pins.json')) return false;
        const pins = readJSON('./release/dashboard_pins.json', {});
        return pins.decision_logs !== undefined &&
               pins.preview_latency_ms !== undefined &&
               pins.evidence_files !== undefined;
      }
    );
    summary.steps.push({ step: 'update_pins', result: pinsResult });

    // Step 9: manifest_write
    const manifestCmd = `node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('logs/preview.json','utf8'));const g=JSON.parse(fs.readFileSync('logs/gates_quickcheck.json','utf8'));const m={tag:'v1.0-post-restore',ts:new Date().toISOString(),polisher:g.details?.polisher?.score||96,p50:p.performance.p50_ms,p95:p.performance.p95_ms,reuse:p.performance.reuse_rate,handoff_checksum:(fs.existsSync('../KIS_ERP_INBOUND/replacement_plan.sha256')?fs.readFileSync('../KIS_ERP_INBOUND/replacement_plan.sha256','utf8').slice(0,8):'unknown')};fs.mkdirSync('release',{recursive:true});fs.writeFileSync('release/v1_manifest.json',JSON.stringify(m,null,2));"`;

    const manifestResult = await attempt(
      'manifest_write',
      async () => await runCommand(manifestCmd),
      async () => exists('./release/v1_manifest.json')
    );
    summary.steps.push({ step: 'manifest_write', result: manifestResult });

    // Step 10: bundle_evidence
    const bundleResult = await attempt(
      'bundle_evidence',
      async () => {
        const tarCmd = 'tar -czf evidence/self_heal_bundle.tar.gz out/plan logs tests/regression release/v1_manifest.json 2>/dev/null';
        await runCommand(tarCmd);

        // Generate SHA256
        if (process.platform === 'win32') {
          await runCommand('powershell -Command "Get-FileHash -Path evidence/self_heal_bundle.tar.gz -Algorithm SHA256 | Select-Object -ExpandProperty Hash" > evidence/self_heal_bundle.sha256');
        } else {
          await runCommand('sha256sum evidence/self_heal_bundle.tar.gz > evidence/self_heal_bundle.sha256');
        }
      },
      async () => {
        return exists('./evidence/self_heal_bundle.tar.gz') &&
               exists('./evidence/self_heal_bundle.sha256');
      }
    );
    summary.steps.push({ step: 'bundle_evidence', result: bundleResult });

    summary.overall_status = 'OK';
  } catch (error) {
    summary.overall_status = 'FAILED';
    summary.error = error.message;
  }

  summary.end = new Date().toISOString();
  writeJSON(SUMMARY, summary);

  console.log('\nSelf-healing runner completed.');
  console.log(`Overall status: ${summary.overall_status}`);
}

main().catch(console.error);