import { test, expect } from '@playwright/test';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Bundle Regression Guard', () => {
  test('Detects applied bundle rules & items', async () => {
    const zipPath = path.resolve(process.cwd(), 'artifacts', 'latest_estimate.zip');
    expect(fs.existsSync(zipPath)).toBeTruthy();
    const script = path.resolve(__dirname, '../../scripts/bundleGuard.js');
    expect(fs.existsSync(script)).toBeTruthy();
    try { cp.execFileSync('node', [script, zipPath], { stdio: 'inherit' }); }
    catch (e) { throw new Error('Bundle guard failed — bundle rules/items missing.'); }
  });
});