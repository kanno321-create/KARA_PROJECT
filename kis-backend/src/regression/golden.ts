import { promises as fs } from 'fs';
import path from 'path';
import type { PrismaClient } from '@prisma/client';
import { EstimateService } from '../services/estimate.service.js';

// ============================================
// Golden Set Regression Testing
// ============================================

interface GoldenCase {
  name: string;
  input: any;
  expected: {
    enclosure?: {
      form: string;
      W: number;
      H: number;
      D: number;
    };
    brand?: string;
    status?: string;
  };
}

interface RegressionResult {
  passed: number;
  changed: number;
  failed: number;
  total: number;
  cases: Array<{
    name: string;
    status: 'PASS' | 'CHANGE' | 'FAIL';
    expected?: any;
    actual?: any;
    diff?: any;
  }>;
}

/**
 * Run golden set regression testing
 */
export async function runGoldenRegression(
  prisma: PrismaClient,
  options: {
    versionLabel: string;
    compareWith?: string; // Previous version to compare with
  }
): Promise<RegressionResult> {
  console.log(`🧪 Running golden regression for version: ${options.versionLabel}`);

  const result: RegressionResult = {
    passed: 0,
    changed: 0,
    failed: 0,
    total: 0,
    cases: [],
  };

  try {
    // Load golden test cases
    const goldenCases = await loadGoldenCases();
    result.total = goldenCases.length;

    console.log(`Found ${goldenCases.length} golden test cases`);

    // Create estimate service
    const estimateService = new EstimateService(prisma);

    // Run each test case
    for (const testCase of goldenCases) {
      try {
        console.log(`Testing: ${testCase.name}`);

        // Validate input
        const validation = await estimateService.validateEstimate(testCase.input);

        if (!validation.isValid) {
          result.cases.push({
            name: testCase.name,
            status: 'FAIL',
            expected: testCase.expected,
            actual: { errors: validation.errors },
            diff: { reason: 'Validation failed' },
          });
          result.failed++;
          continue;
        }

        // Create estimate (this will test the full pipeline)
        const estimate = await estimateService.createEstimate(testCase.input);

        // Compare results
        const comparison = compareResults(testCase.expected, estimate);

        result.cases.push({
          name: testCase.name,
          status: comparison.status,
          expected: testCase.expected,
          actual: estimate.decision === 'OK' ? {
            enclosure: estimate.estimate.enclosure,
            brand: estimate.estimate.brand,
            status: estimate.estimate.status,
          } : {
            decision: estimate.decision,
            reasons: estimate.reasons,
            stage: estimate.metadata.stage,
          },
          diff: comparison.diff,
        });

        if (comparison.status === 'PASS') {
          result.passed++;
        } else if (comparison.status === 'CHANGE') {
          result.changed++;
        } else {
          result.failed++;
        }

      } catch (error: any) {
        console.error(`Golden test failed for ${testCase.name}:`, error);
        result.cases.push({
          name: testCase.name,
          status: 'FAIL',
          expected: testCase.expected,
          actual: null,
          diff: { error: error.message },
        });
        result.failed++;
      }
    }

    console.log(`🧪 Regression completed: ${result.passed} passed, ${result.changed} changed, ${result.failed} failed`);

    return result;
  } catch (error: any) {
    console.error('Golden regression failed:', error);
    throw error;
  }
}

/**
 * Load golden test cases from files
 */
async function loadGoldenCases(): Promise<GoldenCase[]> {
  const goldenDir = path.join(process.cwd(), 'test', 'golden', 'estimates');

  try {
    const files = await fs.readdir(goldenDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    const cases: GoldenCase[] = [];

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(goldenDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const testCase = JSON.parse(content) as GoldenCase;
        cases.push(testCase);
      } catch (error: any) {
        console.warn(`Failed to load golden case ${file}: ${error.message}`);
      }
    }

    return cases;
  } catch (error: any) {
    console.warn(`Golden test directory not found: ${goldenDir}`);
    return [];
  }
}

/**
 * Compare expected vs actual results
 */
function compareResults(expected: any, actual: any): {
  status: 'PASS' | 'CHANGE' | 'FAIL';
  diff: any;
} {
  try {
    const diff: any = {};
    let hasChanges = false;
    let hasFails = false;

    // Compare enclosure dimensions
    if (expected.enclosure && actual.enclosure) {
      const enclosureDiff = compareEnclosure(expected.enclosure, actual.enclosure);
      if (enclosureDiff.hasChanges) {
        diff.enclosure = enclosureDiff.diff;
        hasChanges = true;
      }
      if (enclosureDiff.hasFails) {
        hasFails = true;
      }
    } else if (expected.enclosure && !actual.enclosure) {
      diff.enclosure = { missing: true };
      hasFails = true;
    }

    // Compare brand
    if (expected.brand && expected.brand !== actual.brand) {
      diff.brand = { expected: expected.brand, actual: actual.brand };
      hasChanges = true;
    }

    // Compare status
    if (expected.status && expected.status !== actual.status) {
      diff.status = { expected: expected.status, actual: actual.status };

      // Status differences are usually failures unless going from draft to validated
      if (!(expected.status === 'validated' && actual.status === 'draft')) {
        hasFails = true;
      }
    }

    if (hasFails) {
      return { status: 'FAIL', diff };
    } else if (hasChanges) {
      return { status: 'CHANGE', diff };
    } else {
      return { status: 'PASS', diff: {} };
    }
  } catch (error: any) {
    return { status: 'FAIL', diff: { error: error.message } };
  }
}

/**
 * Compare enclosure dimensions with tolerance
 */
function compareEnclosure(expected: any, actual: any): {
  hasChanges: boolean;
  hasFails: boolean;
  diff: any;
} {
  const diff: any = {};
  let hasChanges = false;
  let hasFails = false;

  // Tolerance for dimension comparisons (5mm)
  const tolerance = 5;

  const dimensions = ['W', 'H', 'D'];
  for (const dim of dimensions) {
    if (expected[dim] !== undefined) {
      const expectedVal = expected[dim];
      const actualVal = actual[dim];

      if (actualVal === undefined) {
        diff[dim] = { missing: true };
        hasFails = true;
      } else {
        const difference = Math.abs(expectedVal - actualVal);
        if (difference > tolerance) {
          diff[dim] = {
            expected: expectedVal,
            actual: actualVal,
            difference,
            tolerance,
          };

          // Large differences (>20mm) are failures, small ones are changes
          if (difference > 20) {
            hasFails = true;
          } else {
            hasChanges = true;
          }
        }
      }
    }
  }

  // Compare form
  if (expected.form && expected.form !== actual.form) {
    diff.form = { expected: expected.form, actual: actual.form };
    hasChanges = true;
  }

  return { hasChanges, hasFails, diff };
}

/**
 * Save regression report to file
 */
export async function saveRegressionReport(
  result: RegressionResult,
  versionLabel: string,
  reportId: string
): Promise<string> {
  const reportDir = path.join(process.cwd(), 'test', 'reports');
  await fs.mkdir(reportDir, { recursive: true });

  const reportPath = path.join(reportDir, `regression-${versionLabel}-${reportId}.json`);

  const report = {
    version: versionLabel,
    reportId,
    timestamp: new Date().toISOString(),
    summary: {
      total: result.total,
      passed: result.passed,
      changed: result.changed,
      failed: result.failed,
      successRate: result.total > 0 ? (result.passed / result.total) * 100 : 0,
    },
    cases: result.cases,
  };

  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`📊 Regression report saved: ${reportPath}`);
  return reportPath;
}

/**
 * Create additional golden test cases (for development)
 */
export async function createAdditionalGoldenCases(): Promise<void> {
  const goldenDir = path.join(process.cwd(), 'test', 'golden', 'estimates');
  await fs.mkdir(goldenDir, { recursive: true });

  // Additional test cases for comprehensive coverage
  const additionalCases = [
    {
      name: "SANGDO 표준형 4P",
      input: {
        brand: "SANGDO",
        form: "STANDARD",
        installation: { location: "INDOOR", mount: "SURFACE" },
        device: { type: "MCCB" },
        main: { model: "SBS-603", poles: "4P" },
        branches: [{ model: "SBS-203", poles: "3P", qty: 1 }],
        accessories: { enabled: false }
      },
      expected: {
        enclosure: { form: "STANDARD", W: 400, H: 500, D: 250 },
        brand: "SANGDO",
        status: "validated"
      }
    },
    {
      name: "LS 대용량 AF800",
      input: {
        brand: "LS",
        form: "ECONOMIC",
        installation: { location: "OUTDOOR", mount: "FLUSH" },
        device: { type: "MCCB" },
        main: { af: 800, poles: "3P" },
        branches: [{ af: 400, poles: "3P", qty: 2 }],
        accessories: { enabled: false }
      },
      expected: {
        enclosure: { form: "ECONOMIC", W: 500, H: 600, D: 300 },
        brand: "LS",
        status: "validated"
      }
    },
    {
      name: "혼합 브랜드 (if enabled)",
      input: {
        brand: "MIXED",
        form: "ECONOMIC",
        installation: { location: "INDOOR", mount: "FLUSH" },
        device: { type: "MCCB" },
        main: { model: "SBS-603", poles: "3P" },
        branches: [{ af: 225, poles: "3P", qty: 1 }],
        accessories: { enabled: false }
      },
      expected: {
        brand: "MIXED",
        status: "validated"
      }
    }
  ];

  for (let i = 0; i < additionalCases.length; i++) {
    const fileName = `golden-${String(i + 10).padStart(2, '0')}-auto.json`;
    const filePath = path.join(goldenDir, fileName);

    try {
      await fs.access(filePath);
      // File exists, skip
    } catch {
      // File doesn't exist, create it
      await fs.writeFile(filePath, JSON.stringify(additionalCases[i], null, 2), 'utf-8');
      console.log(`Created golden case: ${fileName}`);
    }
  }
}