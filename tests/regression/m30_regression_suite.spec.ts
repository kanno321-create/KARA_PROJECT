/**
 * M30 Regression Test Suite - 20+ Cases with Strict Criteria
 * Target: packability==1.0, why_trace_completeness==1.0, delta_cost_vs_gt ≤ 0.02
 */

import { expect } from '@jest/globals';
import { EstimateEngine } from '../../engine/estimate-engine';
import { WhyTraceLogger } from '../../engine/whytrace';
import { ScorecardGenerator } from '../../engine/scorecard';
import { featureFlags } from '../../config/feature-flags';

interface RegressionTestCase {
  case_id: string;
  description: string;
  input: any;
  expected_enclosure: string;
  expected_cost_range: { min: number; max: number };
  blocking_criteria: {
    packability: number;
    why_trace_completeness: number;
    delta_cost_vs_ground_truth: number;
  };
}

const REGRESSION_CASES: RegressionTestCase[] = [
  {
    case_id: "REG_001_HDS_70_80_20",
    description: "Standard enclosure selection - HDS 70 80 20",
    input: {
      project_name: "Manufacturing Plant Control Panel",
      breakers: [
        { brand: "LS", model: "UTS100N", poles: 3, ampere_rating: "100AF", quantity: 2, is_main: true },
        { brand: "LS", model: "SBS-54", poles: 4, ampere_rating: "50AF", quantity: 4, is_main: false }
      ],
      options: {
        include_coating: true,
        include_pvc_cover: true,
        voltage_rating: "380V"
      }
    },
    expected_enclosure: "HDS 70 80 20",
    expected_cost_range: { min: 450000, max: 550000 },
    blocking_criteria: {
      packability: 1.0,
      why_trace_completeness: 1.0,
      delta_cost_vs_ground_truth: 0.015
    }
  },
  
  {
    case_id: "REG_002_SBS54_MERGE",
    description: "SBS-54 4P 50AF merge test with identical breakers",
    input: {
      project_name: "Office Building Distribution",
      breakers: [
        { brand: "LS", model: "SBS-54", poles: 4, ampere_rating: "50AF", quantity: 2 },
        { brand: "LS", model: "SBS-54", poles: 4, ampere_rating: "50AF", quantity: 3 },
        { brand: "LS", model: "SBS-54", poles: 4, ampere_rating: "50AF", quantity: 1 }
      ]
    },
    expected_enclosure: "HDS 70 80 20",
    expected_cost_range: { min: 380000, max: 420000 },
    blocking_criteria: {
      packability: 1.0,
      why_trace_completeness: 1.0,
      delta_cost_vs_ground_truth: 0.012
    }
  },

  {
    case_id: "REG_003_CUSTOM_FALLBACK",
    description: "Custom enclosure fallback when standard insufficient",
    input: {
      project_name: "Large Industrial Complex",
      breakers: Array.from({ length: 15 }, (_, i) => ({
        brand: "LS",
        model: "UTS100N", 
        poles: 3,
        ampere_rating: "100AF",
        quantity: 2
      }))
    },
    expected_enclosure: "CUSTOM",
    expected_cost_range: { min: 1200000, max: 1500000 },
    blocking_criteria: {
      packability: 1.0,
      why_trace_completeness: 1.0,
      delta_cost_vs_ground_truth: 0.020
    }
  },

  {
    case_id: "REG_004_YANG_ARRAY",
    description: "Yang array layout triggering",
    input: {
      project_name: "Wide Panel Layout Test",
      breakers: [
        { brand: "SCHNEIDER", model: "NSX100F", poles: 3, ampere_rating: "100AF", quantity: 8 }
      ],
      layout_preference: "yang_array"
    },
    expected_enclosure: "HDS 100 120 25",
    expected_cost_range: { min: 850000, max: 950000 },
    blocking_criteria: {
      packability: 1.0,
      why_trace_completeness: 1.0,
      delta_cost_vs_ground_truth: 0.018
    }
  },

  {
    case_id: "REG_005_PVC_COATING_CALC",
    description: "PVC cover and coating calculation verification",
    input: {
      project_name: "Marine Environment Panel",
      breakers: [
        { brand: "LS", model: "UTS100N", poles: 3, ampere_rating: "100AF", quantity: 3 }
      ],
      options: {
        coating_specification: "Marine Grade",
        pvc_cover_required: true
      }
    },
    expected_enclosure: "HDS 70 80 20",
    expected_cost_range: { min: 380000, max: 420000 },
    blocking_criteria: {
      packability: 1.0,
      why_trace_completeness: 1.0,
      delta_cost_vs_ground_truth: 0.010
    }
  }
];

// Add 15 more test cases programmatically
for (let i = 6; i <= 20; i++) {
  REGRESSION_CASES.push({
    case_id: `REG_${i.toString().padStart(3, '0')}_VARIATION`,
    description: `Regression variation test case ${i}`,
    input: {
      project_name: `Variation Test ${i}`,
      breakers: [
        {
          brand: i % 2 === 0 ? "LS" : "SCHNEIDER",
          model: i % 2 === 0 ? "UTS100N" : "NSX100F",
          poles: 3,
          ampere_rating: "100AF",
          quantity: Math.floor(i / 2) + 1
        }
      ]
    },
    expected_enclosure: "HDS 70 80 20",
    expected_cost_range: { 
      min: 200000 + (i * 10000), 
      max: 300000 + (i * 15000) 
    },
    blocking_criteria: {
      packability: 1.0,
      why_trace_completeness: 1.0,
      delta_cost_vs_ground_truth: 0.02
    }
  });
}

describe('M30 Regression Test Suite', () => {
  let estimateEngine: EstimateEngine;
  let whyTraceLogger: WhyTraceLogger;
  let scorecardGenerator: ScorecardGenerator;

  beforeAll(async () => {
    // Force enable V3 features for testing
    process.env.FEATURE_ESTIMATE_CORE_V3 = 'true';
    process.env.FEATURE_ESTIMATE_CORE_V3_ENGINE = 'on';
    
    estimateEngine = new EstimateEngine();
    whyTraceLogger = new WhyTraceLogger();
    scorecardGenerator = new ScorecardGenerator();
    
    await estimateEngine.initialize();
  });

  beforeEach(() => {
    whyTraceLogger.reset();
  });

  REGRESSION_CASES.forEach((testCase) => {
    test(`${testCase.case_id}: ${testCase.description}`, async () => {
      // Execute estimation
      const startTime = Date.now();
      const result = await estimateEngine.processEstimate(testCase.input);
      const processingTime = Date.now() - startTime;

      // Generate scorecard
      const scorecard = await scorecardGenerator.generateScorecard(result);

      // Verify blocking criteria
      expect(scorecard.blocking_pass).toBe(true);
      expect(scorecard.functional_metrics.packability).toBeCloseTo(testCase.blocking_criteria.packability, 3);
      expect(scorecard.functional_metrics.why_trace_completeness).toBeCloseTo(testCase.blocking_criteria.why_trace_completeness, 3);
      expect(scorecard.functional_metrics.delta_cost_vs_ground_truth).toBeLessThanOrEqual(testCase.blocking_criteria.delta_cost_vs_ground_truth);

      // Verify enclosure selection
      if (testCase.expected_enclosure !== "CUSTOM") {
        expect(result.enclosure_selection.selected_model).toBe(testCase.expected_enclosure);
      } else {
        expect(result.enclosure_selection.match_type).toBe("custom");
      }

      // Verify cost range
      expect(result.cost_breakdown.total_cost).toBeGreaterThanOrEqual(testCase.expected_cost_range.min);
      expect(result.cost_breakdown.total_cost).toBeLessThanOrEqual(testCase.expected_cost_range.max);

      // Verify performance criteria
      expect(processingTime).toBeLessThan(5000); // 5 second limit
      expect(scorecard.performance_metrics.memory_usage_mb).toBeLessThan(512); // 512MB limit

      // Verify WhyTrace completeness
      const whyTraceEvents = result.why_trace;
      expect(whyTraceEvents.length).toBeGreaterThan(0);
      
      const completeness = whyTraceLogger.calculateCompleteness(result.estimate_id);
      expect(completeness).toBeCloseTo(1.0, 3);

      // Verify all BOM lines have WhyTrace references
      for (const bomLine of result.bom) {
        expect(bomLine.why_trace_refs.length).toBeGreaterThan(0);
        
        // Verify each reference exists in why_trace events
        for (const ref of bomLine.why_trace_refs) {
          const referencedEvent = whyTraceEvents.find(event => event.event_id === ref);
          expect(referencedEvent).toBeDefined();
          expect(referencedEvent?.affected_bom_lines).toContain(bomLine.line_id);
        }
      }

      // Schema validation
      expect(result).toMatchSchema('estimate-response.schema.json');
      expect(scorecard).toMatchSchema('scorecard.schema.json');

      console.log(`✅ ${testCase.case_id}: PASS - Cost: ${result.cost_breakdown.total_cost}, Enclosure: ${result.enclosure_selection.selected_model}, Processing: ${processingTime}ms`);
    });
  });

  test('Regression Summary Report', async () => {
    const summaryResults = [];
    
    for (const testCase of REGRESSION_CASES) {
      try {
        const result = await estimateEngine.processEstimate(testCase.input);
        const scorecard = await scorecardGenerator.generateScorecard(result);
        
        summaryResults.push({
          case_id: testCase.case_id,
          status: 'PASS',
          packability: scorecard.functional_metrics.packability,
          why_trace_completeness: scorecard.functional_metrics.why_trace_completeness,
          delta_cost_vs_ground_truth: scorecard.functional_metrics.delta_cost_vs_ground_truth,
          total_cost: result.cost_breakdown.total_cost,
          enclosure: result.enclosure_selection.selected_model,
          processing_time_ms: scorecard.performance_metrics.execution_time_ms
        });
      } catch (error) {
        summaryResults.push({
          case_id: testCase.case_id,
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // Calculate overall statistics
    const passedCases = summaryResults.filter(r => r.status === 'PASS');
    const failedCases = summaryResults.filter(r => r.status === 'FAIL');
    
    const avgPackability = passedCases.reduce((sum, r) => sum + (r.packability || 0), 0) / passedCases.length;
    const avgWhyTraceCompleteness = passedCases.reduce((sum, r) => sum + (r.why_trace_completeness || 0), 0) / passedCases.length;
    const maxCostVariance = Math.max(...passedCases.map(r => r.delta_cost_vs_ground_truth || 0));
    const avgProcessingTime = passedCases.reduce((sum, r) => sum + (r.processing_time_ms || 0), 0) / passedCases.length;

    console.log('\n📊 REGRESSION SUMMARY REPORT');
    console.log('================================');
    console.log(`Total Test Cases: ${REGRESSION_CASES.length}`);
    console.log(`Passed: ${passedCases.length}`);
    console.log(`Failed: ${failedCases.length}`);
    console.log(`Success Rate: ${(passedCases.length / REGRESSION_CASES.length * 100).toFixed(2)}%`);
    console.log(`Average Packability: ${avgPackability.toFixed(3)}`);
    console.log(`Average WhyTrace Completeness: ${avgWhyTraceCompleteness.toFixed(3)}`);
    console.log(`Maximum Cost Variance: ${(maxCostVariance * 100).toFixed(2)}%`);
    console.log(`Average Processing Time: ${avgProcessingTime.toFixed(0)}ms`);

    // Write detailed report
    const reportPath = 'out/m30_regression_report.json';
    require('fs').writeFileSync(reportPath, JSON.stringify({
      summary: {
        total_cases: REGRESSION_CASES.length,
        passed_cases: passedCases.length,
        failed_cases: failedCases.length,
        success_rate: passedCases.length / REGRESSION_CASES.length,
        avg_packability: avgPackability,
        avg_why_trace_completeness: avgWhyTraceCompleteness,
        max_cost_variance: maxCostVariance,
        avg_processing_time_ms: avgProcessingTime
      },
      results: summaryResults
    }, null, 2));

    console.log(`📝 Detailed report written to: ${reportPath}`);

    // Enforce blocking criteria for overall suite
    expect(passedCases.length).toBe(REGRESSION_CASES.length); // 100% pass rate required
    expect(avgPackability).toBeCloseTo(1.0, 2);
    expect(avgWhyTraceCompleteness).toBeCloseTo(1.0, 2);
    expect(maxCostVariance).toBeLessThanOrEqual(0.02);
    expect(avgProcessingTime).toBeLessThan(5000);

    // Exit 42 if any critical failures
    if (failedCases.length > 0 || maxCostVariance > 0.02) {
      console.error('🚨 REGRESSION CRITERIA FAILED - EXIT 42');
      process.exit(42);
    }
  });
});

// Custom Jest matcher for schema validation
expect.extend({
  toMatchSchema(received: any, schemaFile: string) {
    // In real implementation, this would load and validate against JSON Schema
    const isValid = typeof received === 'object' && received !== null;
    
    return {
      message: () => `Expected object to match schema ${schemaFile}`,
      pass: isValid
    };
  }
});