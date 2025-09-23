#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const pinsPath = './release/dashboard_pins.json';
const logsDir = './logs';
const releaseDir = './release';

async function updatePins() {
  if (!fs.existsSync(releaseDir)) fs.mkdirSync(releaseDir, {recursive: true});

  // Load or create pins
  let pins = {};
  if (fs.existsSync(pinsPath)) {
    pins = JSON.parse(fs.readFileSync(pinsPath, 'utf8'));
  } else {
    pins = {
      decision_logs: 0,
      preview_latency_ms: 0,
      evidence_files: 0,
      last_update: null
    };
  }

  // Load preview performance
  const previewPath = path.join(logsDir, 'preview.json');
  let latency = 50; // default
  if (fs.existsSync(previewPath)) {
    const preview = JSON.parse(fs.readFileSync(previewPath, 'utf8'));
    latency = preview.performance.p50_ms;
  }

  // Count evidence files
  const evidenceCount = fs.existsSync('./out/plan/evidence') ?
    fs.readdirSync('./out/plan/evidence').length : 0;

  // Update pins
  pins.decision_logs = (pins.decision_logs || 0) + 1;
  pins.preview_latency_ms = latency;
  pins.evidence_files = evidenceCount;
  pins.last_update = new Date().toISOString();

  // Save updated pins
  fs.writeFileSync(pinsPath, JSON.stringify(pins, null, 2));

  console.log(`Pins updated: decision_logs=${pins.decision_logs}, latency=${latency}ms, evidence=${evidenceCount}`);
  return pins;
}

updatePins().catch(console.error);