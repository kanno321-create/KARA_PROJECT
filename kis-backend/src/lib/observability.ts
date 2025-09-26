/**
 * 관측지표 (Observability) 시스템
 * 로그 키 표준화 + 메트릭 카운터 + 성능 모니터링
 */

import { FastifyRequest, FastifyReply } from 'fastify';

// ============================================
// 메트릭 카운터 (In-Memory)
// ============================================

interface MetricCounters {
  estimate_decision_total: Record<string, number>;
  estimate_error_total: Record<string, number>;
  estimate_duration_histogram: number[];
}

const metrics: MetricCounters = {
  estimate_decision_total: {
    OK: 0,
    ABSTAIN: 0,
    REJECT: 0
  },
  estimate_error_total: {
    'schema_validation_422': 0,
    'system_error_500': 0,
    'business_rule_422': 0
  },
  estimate_duration_histogram: []
};

// ============================================
// 로그 키 표준화
// ============================================

export interface DecisionLogData {
  stage: 'knowledge' | 'validation' | 'calculation' | 'business_rules';
  decision: 'OK' | 'ABSTAIN' | 'REJECT';
  reason: string;
  requestId: string;
  latency_ms: number;
  http_status: number;
  metadata?: Record<string, any>;
}

export function logDecision(logger: any, data: DecisionLogData): void {
  // 메트릭 업데이트
  if (data.http_status === 200) {
    metrics.estimate_decision_total[data.decision] =
      (metrics.estimate_decision_total[data.decision] || 0) + 1;
  } else if (data.http_status === 422) {
    const errorType = data.stage === 'validation' ? 'schema_validation_422' : 'business_rule_422';
    metrics.estimate_error_total[errorType] =
      (metrics.estimate_error_total[errorType] || 0) + 1;
  } else if (data.http_status === 500) {
    metrics.estimate_error_total['system_error_500'] =
      (metrics.estimate_error_total['system_error_500'] || 0) + 1;
  }

  // 성능 히스토그램 업데이트
  metrics.estimate_duration_histogram.push(data.latency_ms);

  // 최근 1000개만 유지
  if (metrics.estimate_duration_histogram.length > 1000) {
    metrics.estimate_duration_histogram.shift();
  }

  // 구조화된 로그
  logger.info('Decision made', {
    stage: data.stage,
    decision: data.decision,
    reason: data.reason,
    requestId: data.requestId,
    latency_ms: data.latency_ms,
    http_status: data.http_status,
    metadata: data.metadata
  });
}

export function logError(logger: any, error: any, requestId: string, latency_ms: number): void {
  const errorType = error.statusCode === 422 ? 'schema_validation_422' : 'system_error_500';
  metrics.estimate_error_total[errorType] =
    (metrics.estimate_error_total[errorType] || 0) + 1;

  metrics.estimate_duration_histogram.push(latency_ms);

  logger.error('Request failed', {
    stage: 'error_handling',
    decision: 'ERROR',
    reason: error.code || 'UNKNOWN_ERROR',
    requestId,
    latency_ms,
    http_status: error.statusCode || 500,
    error_message: error.message,
    stack: error.stack
  });
}

// ============================================
// 성능 지표 계산
// ============================================

export function getPerformanceStats() {
  const durations = metrics.estimate_duration_histogram.slice().sort((a, b) => a - b);
  const count = durations.length;

  if (count === 0) {
    return { count: 0, min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
  }

  const min = durations[0];
  const max = durations[count - 1];
  const avg = durations.reduce((sum, d) => sum + d, 0) / count;
  const p95 = durations[Math.floor(count * 0.95)] || max;
  const p99 = durations[Math.floor(count * 0.99)] || max;

  return { count, min, max, avg: Math.round(avg), p95, p99 };
}

// ============================================
// 메트릭 엔드포인트
// ============================================

export function getMetrics() {
  const performance = getPerformanceStats();

  return {
    // 결정별 카운터
    decisions: metrics.estimate_decision_total,

    // 에러별 카운터
    errors: metrics.estimate_error_total,

    // 성능 지표
    performance,

    // 전체 요청 수
    total_requests: Object.values(metrics.estimate_decision_total).reduce((sum, count) => sum + count, 0) +
                   Object.values(metrics.estimate_error_total).reduce((sum, count) => sum + count, 0),

    // 성공률
    success_rate: (() => {
      const total = Object.values(metrics.estimate_decision_total).reduce((sum, count) => sum + count, 0) +
                   Object.values(metrics.estimate_error_total).reduce((sum, count) => sum + count, 0);
      const successful = Object.values(metrics.estimate_decision_total).reduce((sum, count) => sum + count, 0);
      return total > 0 ? Math.round((successful / total) * 100) : 0;
    })(),

    // 지식 부재율 (ABSTAIN 비율)
    knowledge_gap_rate: (() => {
      const total = Object.values(metrics.estimate_decision_total).reduce((sum, count) => sum + count, 0);
      const abstains = metrics.estimate_decision_total.ABSTAIN || 0;
      return total > 0 ? Math.round((abstains / total) * 100) : 0;
    })()
  };
}

// ============================================
// 알람 조건
// ============================================

export interface AlertConditions {
  performance_p95_threshold_ms: number;
  error_rate_threshold_percent: number;
  knowledge_gap_threshold_percent: number;
}

const DEFAULT_ALERT_CONDITIONS: AlertConditions = {
  performance_p95_threshold_ms: 200, // dev: 100ms, prod: 300ms
  error_rate_threshold_percent: 5,   // 에러율 5% 초과 시 알람
  knowledge_gap_threshold_percent: 80 // 지식 부재율 80% 초과 시 알람
};

export function checkAlertConditions(conditions: AlertConditions = DEFAULT_ALERT_CONDITIONS) {
  const metrics_data = getMetrics();
  const alerts: string[] = [];

  // 성능 경보
  if (metrics_data.performance.p95 > conditions.performance_p95_threshold_ms) {
    alerts.push(`Performance degradation: p95=${metrics_data.performance.p95}ms > ${conditions.performance_p95_threshold_ms}ms`);
  }

  // 에러율 경보
  const error_rate = 100 - metrics_data.success_rate;
  if (error_rate > conditions.error_rate_threshold_percent) {
    alerts.push(`High error rate: ${error_rate}% > ${conditions.error_rate_threshold_percent}%`);
  }

  // 지식 부재율 경보
  if (metrics_data.knowledge_gap_rate > conditions.knowledge_gap_threshold_percent) {
    alerts.push(`High knowledge gap rate: ${metrics_data.knowledge_gap_rate}% > ${conditions.knowledge_gap_threshold_percent}% (need knowledge activation)`);
  }

  return {
    alerts,
    healthy: alerts.length === 0,
    metrics: metrics_data
  };
}

// ============================================
// Fastify 플러그인으로 통합
// ============================================

export function createObservabilityRoutes(fastify: any) {
  // 메트릭 조회
  fastify.get('/metrics', async (_request: FastifyRequest, _reply: FastifyReply) => {
    const metrics_data = getMetrics();
    return metrics_data;
  });

  // 헬스 체크 (알람 조건 포함)
  fastify.get('/health/detailed', async (_request: FastifyRequest, reply: FastifyReply) => {
    const health = checkAlertConditions();

    if (!health.healthy) {
      reply.status(503); // Service Unavailable
    }

    return health;
  });

  // 메트릭 리셋 (개발/테스트용)
  fastify.post('/metrics/reset', async (_request: FastifyRequest, _reply: FastifyReply) => {
    // 메트릭 초기화
    Object.keys(metrics.estimate_decision_total).forEach(key => {
      metrics.estimate_decision_total[key] = 0;
    });
    Object.keys(metrics.estimate_error_total).forEach(key => {
      metrics.estimate_error_total[key] = 0;
    });
    metrics.estimate_duration_histogram.length = 0;

    return { message: 'Metrics reset successfully' };
  });
}

// ============================================
// 요청 추적 미들웨어
// ============================================

export function createRequestTracker() {
  return (request: FastifyRequest, _reply: FastifyReply, done: () => void) => {
    // 요청 시작 시간 기록
    (request as any).startTime = Date.now();

    // 요청 ID 생성 (없으면)
    if (!request.headers['x-request-id']) {
      (request as any).requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    } else {
      (request as any).requestId = request.headers['x-request-id'] as string;
    }

    done();
  };
}