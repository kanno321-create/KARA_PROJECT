/**
 * Estimate Integration Regression Tests
 * samples/estimate.json 기준으로 총원가 편차 ≤2% 검증
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { WhyTraceManager } from '../../engine/whytrace.js';
import { CoreKnowledge } from '../../engine/loader.js';
import { AccessoriesMapper } from '../../engine/accessories-mapper.js';
import { EnclosureChooser } from '../../engine/enclosure-chooser.js';
import * as fs from 'fs';
import * as path from 'path';

// Baseline data from samples/estimate.json
const BASELINE_ESTIMATE = {
  estimate_id: "baseline_v1.0",
  total_cost: 892000, // Expected total cost
  accessories_count: 10,
  enclosure_model: "HDS 70 80 20",
  why_trace_completeness: 1.0,
  max_cost_deviation_percent: 2.0,
  max_count_deviation: 2,
  execution_time_baseline_ms: 5000
};

// Test scenarios based on real project requirements
const REGRESSION_SCENARIOS = [
  {
    name: "Standard Control Panel",
    symbols: ["T", "MAG", "ON_OFF"],
    hints: ["SS"],
    expected_components: {
      timer: 1,
      contactor: 1,
      push_button: 1,
      accessories: ">= 5"
    }
  },
  {
    name: "Motor Control Center",
    symbols: ["MAG", "MAG", "T", "MC", "SPD"],
    hints: ["Emergency"],
    expected_components: {
      contactor: 2,
      timer: 1,
      surge_protector: 1,
      emergency: 1
    }
  },
  {
    name: "Distribution Panel",
    symbols: ["ON_OFF", "ON_OFF", "MT", "SPD"],
    hints: [],
    expected_components: {
      push_button: 2,
      meter: 1,
      surge_protector: 1
    }
  }
];

describe('Estimate Integration Regression Tests', () => {
  let baselineData: any;
  let testResults: any[] = [];

  beforeAll(async () => {
    // Load baseline estimate data
    const baselinePath = 'samples/estimate.json';
    if (fs.existsSync(baselinePath)) {
      baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    } else {
      // Create baseline if not exists
      baselineData = BASELINE_ESTIMATE;
      console.warn(`⚠️ Baseline file not found: ${baselinePath}, using default baseline`);
    }

    // Ensure output directory for regression results
    if (!fs.existsSync('out/regression')) {
      fs.mkdirSync('out/regression', { recursive: true });
    }
  });

  afterAll(async () => {
    // Generate regression report
    await generateRegressionReport(testResults);
  });

  /**
   * Regression Test 1: Standard scenario cost stability
   */
  test('REG-001: Standard scenario within ±2% cost deviation', async () => {
    const startTime = Date.now();

    // Initialize system components
    const whyTraceManager = new WhyTraceManager();
    const coreKnowledge = new CoreKnowledge();
    const accessoriesMapper = new AccessoriesMapper(whyTraceManager, coreKnowledge);
    const enclosureChooser = new EnclosureChooser(whyTraceManager, coreKnowledge);

    // Step 1: Accessories mapping
    const drawingSymbols = ["T", "MAG", "ON_OFF"].map((symbol, index) => ({
      symbol,
      location: `regression_${index + 1}`,
      context: 'regression_test'
    }));

    const accessoryResult = await accessoriesMapper.mapAccessories(drawingSymbols, ["SS"]);

    // Step 2: Enclosure selection
    const enclosureResult = await enclosureChooser.chooseEnclosure({
      bom: accessoryResult.expanded_items,
      brandPref: 'HDS',
      pcover: null,
      economy: false,
      voltageClass: 'LV',
      ambient: 25
    });

    const executionTime = Date.now() - startTime;

    // Calculate costs
    const accessoryCost = accessoryResult.expanded_items.reduce((sum, item) => sum + item.total_price, 0);
    const laborCost = accessoryResult.labor_additions.reduce((sum, labor) => sum + labor.total_cost, 0);
    const totalCost = accessoryCost + laborCost;

    // Regression assertions
    const costDeviation = Math.abs(totalCost - baselineData.total_cost) / baselineData.total_cost * 100;
    const countDeviation = Math.abs(accessoryResult.expanded_items.length - baselineData.accessories_count);

    expect(costDeviation).toBeLessThanOrEqual(BASELINE_ESTIMATE.max_cost_deviation_percent);
    expect(countDeviation).toBeLessThanOrEqual(BASELINE_ESTIMATE.max_count_deviation);
    expect(enclosureResult.why_trace.completeness).toBe(1.0);
    expect(enclosureResult.packable).toBe(true);

    // Performance regression
    expect(executionTime).toBeLessThan(BASELINE_ESTIMATE.execution_time_baseline_ms * 2); // Allow 2x baseline

    const testResult = {
      test_id: 'REG-001',
      scenario: 'Standard Control Panel',
      status: 'PASS',
      cost_baseline: baselineData.total_cost,
      cost_actual: totalCost,
      cost_deviation_percent: costDeviation,
      count_baseline: baselineData.accessories_count,
      count_actual: accessoryResult.expanded_items.length,
      enclosure_model: enclosureResult.model,
      execution_time_ms: executionTime,
      why_trace_completeness: enclosureResult.why_trace.completeness
    };

    testResults.push(testResult);

    console.log(`✅ REG-001: Cost ₩${totalCost.toLocaleString()} (${costDeviation.toFixed(2)}% deviation)`);
    console.log(`  - Items: ${accessoryResult.expanded_items.length} (${countDeviation} deviation)`);
    console.log(`  - Enclosure: ${enclosureResult.model}`);
    console.log(`  - Execution: ${executionTime}ms`);
  }, 30000);

  /**
   * Regression Test 2: Multiple scenarios consistency
   */
  test.each(REGRESSION_SCENARIOS)('REG-002: Scenario consistency - $name', async (scenario) => {
    const startTime = Date.now();

    const whyTraceManager = new WhyTraceManager();
    const coreKnowledge = new CoreKnowledge();
    const accessoriesMapper = new AccessoriesMapper(whyTraceManager, coreKnowledge);
    const enclosureChooser = new EnclosureChooser(whyTraceManager, coreKnowledge);

    // Execute scenario
    const drawingSymbols = scenario.symbols.map((symbol, index) => ({
      symbol,
      location: `scenario_${index + 1}`,
      context: 'regression_scenario'
    }));

    const accessoryResult = await accessoriesMapper.mapAccessories(drawingSymbols, scenario.hints);
    const enclosureResult = await enclosureChooser.chooseEnclosure({
      bom: accessoryResult.expanded_items,
      brandPref: 'HDS',
      pcover: null,
      economy: false,
      voltageClass: 'LV',
      ambient: 25
    });

    const executionTime = Date.now() - startTime;

    // Component type verification
    const componentTypes = accessoryResult.expanded_items.reduce((acc: Record<string, number>, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    // Verify expected components
    Object.entries(scenario.expected_components).forEach(([type, expectedCount]) => {
      const actualCount = componentTypes[type] || 0;
      
      if (typeof expectedCount === 'string' && expectedCount.startsWith('>=')) {
        const minCount = parseInt(expectedCount.replace('>= ', ''));
        expect(actualCount).toBeGreaterThanOrEqual(minCount);
      } else {
        expect(actualCount).toBe(expectedCount);
      }
    });

    // Consistency checks
    expect(enclosureResult.why_trace.completeness).toBe(1.0);
    expect(enclosureResult.packable).toBe(true);
    expect(accessoryResult.expanded_items.length).toBeGreaterThan(scenario.symbols.length); // Should have bundle items

    const testResult = {
      test_id: `REG-002-${scenario.name.replace(/\s+/g, '_')}`,
      scenario: scenario.name,
      status: 'PASS',
      symbols: scenario.symbols,
      hints: scenario.hints,
      component_types: componentTypes,
      total_items: accessoryResult.expanded_items.length,
      enclosure_model: enclosureResult.model,
      execution_time_ms: executionTime,
      why_trace_completeness: enclosureResult.why_trace.completeness
    };

    testResults.push(testResult);

    console.log(`✅ REG-002 ${scenario.name}: ${accessoryResult.expanded_items.length} items, ${enclosureResult.model}`);
    console.log(`  - Components: ${JSON.stringify(componentTypes)}`);
  }, 30000);

  /**
   * Regression Test 3: WhyTrace completeness stability
   */
  test('REG-003: WhyTrace completeness across all scenarios', async () => {
    const testScenarios = [
      { symbols: ["T"], hints: [] },
      { symbols: ["MAG"], hints: [] },
      { symbols: ["T", "MAG"], hints: ["SS"] },
      { symbols: ["T", "MAG", "ON_OFF", "SPD"], hints: ["Emergency", "SS"] }
    ];

    const completenessResults = [];

    for (const scenario of testScenarios) {
      const whyTraceManager = new WhyTraceManager();
      const coreKnowledge = new CoreKnowledge();
      const accessoriesMapper = new AccessoriesMapper(whyTraceManager, coreKnowledge);
      const enclosureChooser = new EnclosureChooser(whyTraceManager, coreKnowledge);

      const drawingSymbols = scenario.symbols.map((symbol, index) => ({
        symbol,
        location: `completeness_${index + 1}`,
        context: 'completeness_test'
      }));

      const accessoryResult = await accessoriesMapper.mapAccessories(drawingSymbols, scenario.hints);
      const enclosureResult = await enclosureChooser.chooseEnclosure({
        bom: accessoryResult.expanded_items,
        brandPref: 'HDS'
      });

      const completeness = enclosureResult.why_trace.completeness;
      expect(completeness).toBe(1.0);

      completenessResults.push({
        symbols: scenario.symbols.join(','),
        hints: scenario.hints.join(','),
        completeness: completeness,
        trace_count: whyTraceManager.export().traces.length
      });
    }

    // All scenarios should have perfect completeness
    const allPerfect = completenessResults.every(result => result.completeness === 1.0);
    expect(allPerfect).toBe(true);

    const testResult = {
      test_id: 'REG-003',
      scenario: 'WhyTrace Completeness',
      status: 'PASS',
      scenarios_tested: completenessResults.length,
      all_perfect_completeness: allPerfect,
      detailed_results: completenessResults
    };

    testResults.push(testResult);

    console.log(`✅ REG-003: All ${completenessResults.length} scenarios achieved 1.0 completeness`);
    completenessResults.forEach(result => {
      console.log(`  - ${result.symbols}: ${result.trace_count} traces, ${result.completeness} completeness`);
    });
  }, 60000);

  /**
   * Regression Test 4: Performance benchmarks
   */
  test('REG-004: Performance benchmarks within acceptable limits', async () => {
    const performanceTests = [
      { name: 'Small', symbols: ["T"], hints: [], maxTime: 2000 },
      { name: 'Medium', symbols: ["T", "MAG", "ON_OFF"], hints: ["SS"], maxTime: 5000 },
      { name: 'Large', symbols: ["T", "MAG", "ON_OFF", "SPD", "MT", "MC"], hints: ["SS", "Emergency"], maxTime: 10000 }
    ];

    const performanceResults = [];

    for (const test of performanceTests) {
      const startTime = Date.now();

      const whyTraceManager = new WhyTraceManager();
      const coreKnowledge = new CoreKnowledge();
      const accessoriesMapper = new AccessoriesMapper(whyTraceManager, coreKnowledge);
      const enclosureChooser = new EnclosureChooser(whyTraceManager, coreKnowledge);

      const drawingSymbols = test.symbols.map((symbol, index) => ({
        symbol,
        location: `perf_${index + 1}`,
        context: 'performance_test'
      }));

      const accessoryResult = await accessoriesMapper.mapAccessories(drawingSymbols, test.hints);
      const enclosureResult = await enclosureChooser.chooseEnclosure({
        bom: accessoryResult.expanded_items,
        brandPref: 'HDS'
      });

      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(test.maxTime);
      expect(enclosureResult.why_trace.completeness).toBe(1.0);

      performanceResults.push({
        test_name: test.name,
        symbols_count: test.symbols.length,
        execution_time_ms: executionTime,
        max_time_ms: test.maxTime,
        within_limit: executionTime < test.maxTime,
        items_generated: accessoryResult.expanded_items.length
      });
    }

    const testResult = {
      test_id: 'REG-004',
      scenario: 'Performance Benchmarks',
      status: 'PASS',
      performance_results: performanceResults,
      all_within_limits: performanceResults.every(r => r.within_limit)
    };

    testResults.push(testResult);

    console.log(`✅ REG-004: Performance benchmarks completed`);
    performanceResults.forEach(result => {
      console.log(`  - ${result.test_name}: ${result.execution_time_ms}ms (limit: ${result.max_time_ms}ms) - ${result.within_limit ? '✅' : '❌'}`);
    });
  }, 45000);
});

/**
 * Generate comprehensive regression report
 */
async function generateRegressionReport(results: any[]): Promise<void> {
  const reportPath = 'out/regression/regression_report.md';
  const timestamp = new Date().toISOString();
  
  const passedTests = results.filter(r => r.status === 'PASS').length;
  const totalTests = results.length;
  const overallStatus = passedTests === totalTests ? 'PASS' : 'FAIL';

  const report = `# Estimate Integration Regression Report

**Generated**: ${timestamp}  
**Overall Status**: ${overallStatus} (${passedTests}/${totalTests} passed)

## Test Results Summary

| Test ID | Scenario | Status | Key Metrics |
|---------|----------|--------|-------------|
${results.map(result => {
  let metrics = '';
  if (result.cost_deviation_percent !== undefined) {
    metrics = `Cost: ${result.cost_deviation_percent.toFixed(2)}% dev`;
  } else if (result.execution_time_ms !== undefined) {
    metrics = `Time: ${result.execution_time_ms}ms`;
  }
  return `| ${result.test_id} | ${result.scenario} | ${result.status} | ${metrics} |`;
}).join('\n')}

## Detailed Results

${results.map(result => `
### ${result.test_id}: ${result.scenario}

**Status**: ${result.status}

${JSON.stringify(result, null, 2)}

---
`).join('\n')}

## Regression Analysis

### Cost Stability
${results.filter(r => r.cost_deviation_percent !== undefined).map(r => 
  `- ${r.test_id}: ₩${r.cost_actual?.toLocaleString()} (${r.cost_deviation_percent.toFixed(2)}% deviation from baseline)`
).join('\n')}

### Performance Analysis
${results.filter(r => r.execution_time_ms !== undefined).map(r => 
  `- ${r.test_id}: ${r.execution_time_ms}ms execution time`
).join('\n')}

### WhyTrace Quality
${results.filter(r => r.why_trace_completeness !== undefined).map(r => 
  `- ${r.test_id}: ${r.why_trace_completeness} completeness`
).join('\n')}

## Recommendations

${overallStatus === 'PASS' ? 
  '✅ All regression tests passed. The system maintains stability across all tested scenarios.' :
  '❌ Some regression tests failed. Please review the failing tests and address the issues before deployment.'
}

## Baseline Comparison

- **Baseline Cost**: ₩${BASELINE_ESTIMATE.total_cost.toLocaleString()}
- **Baseline Items**: ${BASELINE_ESTIMATE.accessories_count}
- **Baseline Model**: ${BASELINE_ESTIMATE.enclosure_model}
- **Max Allowed Deviation**: ±${BASELINE_ESTIMATE.max_cost_deviation_percent}%

---
*Generated by KIS Estimate Integration Regression Tests*
`;

  fs.writeFileSync(reportPath, report, { encoding: 'utf8' });
  console.log(`📄 Regression report generated: ${reportPath}`);

  // Also save raw results as JSON
  const jsonPath = 'out/regression/regression_results.json';
  fs.writeFileSync(jsonPath, JSON.stringify({
    timestamp,
    overall_status: overallStatus,
    passed_tests: passedTests,
    total_tests: totalTests,
    results
  }, null, 2), { encoding: 'utf8' });
}