#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const MAX_ATTEMPTS = 5;
export const BACKOFF_MS = [500, 1000, 1500, 2000, 2500];
export const CHECKPOINT = './out/checkpoints.json';

export function exists(p) {
  return fs.existsSync(p);
}

export function readJSON(p, defaultValue = {}) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return defaultValue;
  }
}

export function writeJSON(p, obj) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function markCheckpoint(step, ok, meta = {}) {
  const checkpoints = readJSON(CHECKPOINT, { steps: [] });
  checkpoints.steps.push({
    step,
    ok,
    ts: new Date().toISOString(),
    ...meta
  });
  writeJSON(CHECKPOINT, checkpoints);
}

export function shouldSkip(step) {
  const checkpoints = readJSON(CHECKPOINT, { steps: [] });
  return checkpoints.steps.some(s => s.step === step && s.ok === true);
}

export async function attempt(step, fn, validateFn) {
  if (shouldSkip(step)) {
    console.log(`[SKIP] ${step} - already completed`);
    return 'SKIP';
  }

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    console.log(`[ATTEMPT ${i}/${MAX_ATTEMPTS}] ${step}`);
    try {
      await fn();

      const valid = await validateFn();
      if (valid) {
        markCheckpoint(step, true, { attempt: i });
        console.log(`[SUCCESS] ${step} - attempt ${i}`);
        return 'OK';
      } else {
        console.log(`[VALIDATE FAIL] ${step} - attempt ${i}`);
      }
    } catch (e) {
      console.log(`[ERROR] ${step} - attempt ${i}: ${e.message || e}`);
      markCheckpoint(step, false, { attempt: i, error: String(e.message || e) });
    }

    if (i < MAX_ATTEMPTS) {
      const delay = BACKOFF_MS[i - 1] || 2500;
      console.log(`[BACKOFF] Waiting ${delay}ms before retry...`);
      await sleep(delay);
    }
  }

  console.log(`[FAILED] ${step} failed after ${MAX_ATTEMPTS} attempts`);
  return 'FAILED';
}