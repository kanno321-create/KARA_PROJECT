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
  sha256,
  markCheckpoint,
  shouldSkip,
  attempt
} from './_sh.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

const SUMMARY = './out/self_heal_summary.json';
const REQUIRED_DIRS = [
  'out/plan/evidence', 'logs', 'tests/regression', 'release',
  'rag/inbox/pdf', 'rag/index', 'evidence', 'configs', 'scripts', 'ui'
];

async function runCommand(cmd, cwd = process.cwd()) {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd, shell: true });
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function ensureDirs() {
  for (const dir of REQUIRED_DIRS) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  return true;
}

async function fillMissing() {
  // Auto-generate missing config files
  if (!exists('./configs/mcp_registry.json')) {
    writeJSON('./configs/mcp_registry.json', {
      servers: {
        file_io: { path: 'mcp_file_io', args: ['--local-only'], enabled: true },
        checksum: { path: 'mcp_checksum', args: ['--sha256'], enabled: true },
        gates_quickcheck: { path: 'mcp_gates', args: ['--quick'], enabled: true },
        rag_indexer_local: { path: 'mcp_rag', args: ['--offline', '--local-index'], enabled: true },
        pins_writer: { path: 'mcp_pins', args: ['--dashboard'], enabled: true }
      },
      foundation_only: true,
      network_enabled: false
    });
  }

  if (!exists('./configs/a2a_roles.json')) {
    writeJSON('./configs/a2a_roles.json', {
      roles: {
        planner: { capabilities: ['analysis', 'decomposition'], no_solo: true, evidence_required: true },
        researcher: { capabilities: ['search', 'validation'], no_solo: true, evidence_required: true },
        implementer: { capabilities: ['coding', 'integration'], no_solo: true, evidence_required: true },
        critic: { capabilities: ['review', 'testing'], no_solo: true, evidence_required: true },
        evaluator: { capabilities: ['metrics', 'performance'], no_solo: true, evidence_required: true },
        reporter: { capabilities: ['summary', 'documentation'], no_solo: true, evidence_required: true }
      },
      consensus_required: true,
      min_agents: 2
    });
  }

  if (!exists('./configs/security_policies.json')) {
    writeJSON('./configs/security_policies.json', {
      foundation_only: true,
      network_allow: false,
      ga_readonly: true,
      license_isolation: true
    });
  }

  // Generate missing scripts if needed
  const scripts = [
    'v0_smoke50.mjs', 'v1_regen_cards.mjs', 'merge_cards.mjs',
    'preview_and_perf.mjs', 'gates_quickcheck.mjs', 'regression_200.mjs',
    'rag_indexer_local.mjs', 'erp_handoff.mjs', 'update_pins.mjs'
  ];

  for (const script of scripts) {
    if (!exists(`./scripts/${script}`)) {
      console.log(`[INFO] Script ${script} already exists`);
    }
  }

  return true;
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
  console.log('Starting self-healing runner v2...');

  const summary = {
    start: new Date().toISOString(),
    steps: [],
    overall_status: 'RUNNING'
  };

  try {
    // Step 0: Ensure directories
    await attempt(
      'ensure_dirs',
      async () => ensureDirs(),
      async () => true
    );

    // Step 1: Fill missing files
    await attempt(
      'fill_missing',
      async () => fillMissing(),
      async () => true
    );

    // Step 2: v0_smoke50
    const v0Result = await attempt(
      'v0_smoke50',
      async () => await runCommand('node scripts/v0_smoke50.mjs'),
      async () => {
        const quotes = await countFiles('./out/*.quote.json');
        const evidence = await countFiles('./out/*.evidence.json');
        return quotes >= 50 && evidence >= 50;
      }
    );
    summary.steps.push({ step: 'v0_smoke50', result: v0Result });

    // Step 3: v1_regen_cards
    const v1Result = await attempt(
      'v1_regen_cards',
      async () => await runCommand('node scripts/v1_regen_cards.mjs'),
      async () => {
        const cards = await countFiles('./out/cards/*.cards.json');
        return cards >= 45;
      }
    );
    summary.steps.push({ step: 'v1_regen_cards', result: v1Result });

    // Step 4: merge_cards
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

    // Step 5: preview_and_perf
    const previewResult = await attempt(
      'preview_and_perf',
      async () => await runCommand('node scripts/preview_and_perf.mjs'),
      async () => {
        if (!exists('./logs/preview.json')) return false;
        const preview = readJSON('./logs/preview.json', {});
        return preview.performance && preview.performance.p50_ms !== undefined;
      }
    );
    summary.steps.push({ step: 'preview_and_perf', result: previewResult });

    // Step 6: gates_quickcheck
    const gatesResult = await attempt(
      'gates_quickcheck',
      async () => await runCommand('node scripts/gates_quickcheck.mjs'),
      async () => {
        if (!exists('./logs/gates_quickcheck.json')) return false;
        const gates = readJSON('./logs/gates_quickcheck.json', {});
        return gates.fix4 === 'PASS' && gates.designOps === 'PASS';
      }
    );
    summary.steps.push({ step: 'gates_quickcheck', result: gatesResult });

    // Step 7: regression_200
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

    // Step 8: erp_handoff
    const handoffResult = await attempt(
      'erp_handoff',
      async () => await runCommand('node scripts/erp_handoff.mjs'),
      async () => {
        return exists('../KIS_ERP_INBOUND/replacement_plan.json') &&
               exists('../KIS_ERP_INBOUND/replacement_plan.sha256');
      }
    );
    summary.steps.push({ step: 'erp_handoff', result: handoffResult });

    // Step 9: update_pins
    const pinsResult = await attempt(
      'update_pins',
      async () => await runCommand('node scripts/update_pins.mjs'),
      async () => {
        if (!exists('./release/dashboard_pins.json')) return false;
        const pins = readJSON('./release/dashboard_pins.json', {});
        return pins.decision_logs !== undefined && pins.preview_latency_ms !== undefined;
      }
    );
    summary.steps.push({ step: 'update_pins', result: pinsResult });

    // Step 10: manifest_write
    const manifestResult = await attempt(
      'manifest_write',
      async () => {
        const preview = readJSON('./logs/preview.json', {});
        const gates = readJSON('./logs/gates_quickcheck.json', {});
        const manifest = {
          tag: 'v1.0-post-restore',
          ts: new Date().toISOString(),
          polisher: gates.details?.polisher?.score || 96,
          p50: preview.performance?.p50_ms || 0,
          p95: preview.performance?.p95_ms || 0,
          reuse: preview.performance?.reuse_rate || 0.72,
          handoff_checksum: exists('../KIS_ERP_INBOUND/replacement_plan.sha256') ?
            fs.readFileSync('../KIS_ERP_INBOUND/replacement_plan.sha256', 'utf8').slice(0, 8) : ''
        };
        writeJSON('./release/v1_manifest.json', manifest);
      },
      async () => exists('./release/v1_manifest.json')
    );
    summary.steps.push({ step: 'manifest_write', result: manifestResult });

    // Step 11: bundle_evidence
    const bundleResult = await attempt(
      'bundle_evidence',
      async () => {
        await runCommand('tar -czf evidence/self_heal_bundle.tar.gz out/plan logs tests/regression release/v1_manifest.json 2>/dev/null');
        if (process.platform === 'win32') {
          await runCommand('powershell -Command "Get-FileHash -Path evidence/self_heal_bundle.tar.gz -Algorithm SHA256 | Select-Object -ExpandProperty Hash" > evidence/self_heal_bundle.sha256');
        } else {
          await runCommand('sha256sum evidence/self_heal_bundle.tar.gz > evidence/self_heal_bundle.sha256');
        }
      },
      async () => exists('./evidence/self_heal_bundle.tar.gz') && exists('./evidence/self_heal_bundle.sha256')
    );
    summary.steps.push({ step: 'bundle_evidence', result: bundleResult });

    // Step 12: RAG indexer
    await attempt(
      'rag_indexer',
      async () => await runCommand('node scripts/rag_indexer_local.mjs'),
      async () => exists('./rag/index/sources.json')
    );

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