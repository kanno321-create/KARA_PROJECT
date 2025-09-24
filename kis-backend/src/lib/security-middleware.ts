// ============================================
// 전역 보안 미들웨어
// ============================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

// 요청 ID 주입 미들웨어
export function requestIdMiddleware(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // 요청 ID가 없으면 UUID v4 생성
    const requestId = request.headers['x-request-id'] as string || uuidv4();

    // @ts-ignore - Fastify에 requestId 추가
    request.requestId = requestId;

    // 응답 헤더에도 추가
    reply.header('X-Request-ID', requestId);
  });
}

// 보안 헤더 미들웨어
export function securityHeadersMiddleware(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (_request: FastifyRequest, reply: FastifyReply) => {
    // 기본 보안 헤더 설정
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Content-Security-Policy', "default-src 'self'");

    // KIS ERP 식별 헤더
    reply.header('X-Powered-By', 'KIS-ERP-Backend');
  });
}

// 감사 로깅 미들웨어
export function auditLogMiddleware(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest, _reply: FastifyReply) => {
    // 시작 시간 기록
    // @ts-ignore
    request.startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!config.audit.logRequests) return;

    // @ts-ignore
    const duration = Date.now() - request.startTime;
    // @ts-ignore
    const requestId = request.requestId;
    const actor = request.headers['x-kis-actor'] as string || 'system';

    const auditLog = {
      requestId,
      method: request.method,
      url: request.url,
      status: reply.statusCode,
      duration,
      actor,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      timestamp: new Date().toISOString(),
    };

    // 로그 출력 (실제 환경에서는 별도 로깅 시스템으로)
    fastify.log.info(auditLog, 'Audit Log');
  });
}

// CORS 화이트리스트 검증
export function corsWhitelistMiddleware(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const origin = request.headers.origin;

    // OPTIONS 요청은 CORS preflight
    if (request.method === 'OPTIONS') {
      if (origin && !config.security.allowedOrigins.includes(origin)) {
        reply.status(403).send({
          code: 'CORS_FORBIDDEN',
          message: 'Origin not allowed',
          origin,
        });
        return;
      }
    }
  });
}

// 바디 크기 제한 (이미 Fastify에서 지원하지만 명시적 체크)
export function bodySizeMiddleware(fastify: FastifyInstance) {
  fastify.addHook('preValidation', async (request: FastifyRequest, reply: FastifyReply) => {
    const contentLength = request.headers['content-length'];

    if (contentLength && parseInt(contentLength) > config.maxJsonSize) {
      reply.status(413).send({
        code: 'PAYLOAD_TOO_LARGE',
        message: `Request body too large. Maximum size: ${config.maxJsonSize} bytes`,
        received: parseInt(contentLength),
      });
      return;
    }
  });
}

// Admin API 키 검증 미들웨어
export function adminAuthMiddleware(_fastify: FastifyInstance) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers['x-api-key'] as string;

    if (!config.security.adminApiKey) {
      reply.status(500).send({
        code: 'ADMIN_API_KEY_NOT_CONFIGURED',
        message: 'Admin API key not configured',
      });
      return;
    }

    if (!apiKey || apiKey !== config.security.adminApiKey) {
      reply.status(401).send({
        code: 'INVALID_API_KEY',
        message: 'Invalid or missing API key',
      });
      return;
    }
  };
}

// 모든 보안 미들웨어 등록
export function registerSecurityMiddlewares(fastify: FastifyInstance) {
  // 순서가 중요함
  requestIdMiddleware(fastify);
  securityHeadersMiddleware(fastify);
  corsWhitelistMiddleware(fastify);
  bodySizeMiddleware(fastify);
  auditLogMiddleware(fastify);
}

// TypeScript 타입 확장
declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
    startTime: number;
  }
}