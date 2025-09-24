import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { config } from './config.js';
import { errorHandler } from './lib/errors.js';
import { initSizeTables } from './lib/size-tables.js';
import { loadActiveKnowledge } from './lib/size-tables-v2.js';
import { registerSecurityMiddlewares } from './lib/security-middleware.js';
import { scheduleIdempotencyCleanup } from './jobs/cleanup-idempotency.js';

// Routes
import { estimateRoutes } from './routes/estimate.js';
import { calendarRoutes } from './routes/calendar.js';
import { emailRoutes } from './routes/email.js';
import { drawingRoutes } from './routes/drawing.js';
import { settingsRoutes } from './routes/settings.js';
import { adminRoutes } from './routes/admin.js';
import { adminKnowledgeRoutes } from './routes/admin-knowledge.js';

// ============================================
// Fastify 앱 생성
// ============================================

export async function createApp() {
  // EVIDENCE_SECRET 필수 검증
  if (!config.security.evidenceSecret) {
    throw new Error('EVIDENCE_SECRET environment variable is required for production');
  }

  // Fastify 인스턴스 생성
  const app = Fastify({
    logger: config.logging.pretty
      ? {
          level: config.logging.level,
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            }
          }
        }
      : {
          level: config.logging.level,
        },
    bodyLimit: config.maxJsonSize, // 256KB 제한
  });

  // ========================================
  // 보안 미들웨어 등록 (최우선)
  // ========================================
  registerSecurityMiddlewares(app);

  // ========================================
  // 플러그인 등록
  // ========================================

  // CORS 지원 (화이트리스트 적용)
  await app.register(import('@fastify/cors'), {
    origin: (origin, callback) => {
      // 개발 환경에서는 origin이 없을 수 있음 (직접 호출)
      if (!origin) return callback(null, true);

      if (config.security.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  // Rate Limiting (엔드포인트별 차등)
  await app.register(import('@fastify/rate-limit'), {
    // max: config.rateLimitRefined.default, // Removed: duplicate property, dynamic max function below handles this
    timeWindow: '1 minute',
    cache: 10000,
    allowList: ['127.0.0.1', '::1'],
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true
    },
    keyGenerator: (request) => {
      // estimate/create는 더 엄격한 제한
      if (request.url.includes('/estimate/create')) {
        return `estimate-create:${request.ip}`;
      }
      if (request.url.includes('/estimate/validate')) {
        return `estimate-validate:${request.ip}`;
      }
      return `default:${request.ip}`;
    },
    max: (request) => {
      if (request.url.includes('/estimate/create')) {
        return config.rateLimitRefined.estimateCreate;
      }
      if (request.url.includes('/estimate/validate')) {
        return config.rateLimitRefined.estimateValidate;
      }
      return config.rateLimitRefined.default;
    }
  });

  // Swagger 문서화
  await app.register(import('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'KIS견적 AI ERP API',
        description: 'Evidence-based Industrial Estimation System',
        version: '1.0.0',
        contact: {
          name: 'KARA PROJECT Team',
          email: 'support@kara-project.com',
        },
      },
      servers: [
        {
          url: `http://localhost:${config.port}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'estimate', description: '견적 관리' },
        { name: 'calendar', description: '캘린더 관리' },
        { name: 'email', description: '이메일 관리' },
        { name: 'drawings', description: '도면 관리' },
        { name: 'settings', description: '설정 관리' },
        { name: 'admin', description: '관리자 기능' },
        { name: 'abstain', description: 'ABSTAIN 큐 관리' },
      ],
    },
  });

  // Swagger UI
  await app.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  // ========================================
  // 데이터베이스 연결
  // ========================================

  const prisma = new PrismaClient({
    log: config.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

  // Prisma를 app에 데코레이터로 추가
  app.decorate('prisma', prisma);

  // 앱 종료 시 Prisma 연결 종료
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  // ========================================
  // 에러 핸들링
  // ========================================

  app.setErrorHandler(errorHandler);

  // ========================================
  // 헬스 체크
  // ========================================

  app.get('/health', {
    schema: {
      summary: '헬스 체크',
      description: '서비스 상태를 확인합니다',
      tags: ['system'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            database: { type: 'string' },
            sizeTables: {
              type: 'object',
              properties: {
                loaded: { type: 'boolean' },
                lsCount: { type: 'number' },
                sangdoCount: { type: 'number' },
              },
            },
          },
        },
      },
    },
    handler: async () => {
      // 데이터베이스 연결 확인
      let dbStatus = 'ok';
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        dbStatus = 'error';
      }

      // 치수표 상태 확인
      const { getCacheInfo } = await import('./lib/size-tables.js');
      const sizeTablesInfo = getCacheInfo();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
        sizeTables: {
          loaded: sizeTablesInfo.isLoaded,
          lsCount: sizeTablesInfo.lsCount || 0,
          sangdoCount: sizeTablesInfo.sangdoCount || 0,
        },
      };
    },
  });

  // ========================================
  // API 정보
  // ========================================

  app.get('/info', {
    schema: {
      summary: 'API 정보',
      description: 'API 버전 및 기본 정보를 반환합니다',
      tags: ['system'],
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' },
            apiVersion: { type: 'string' },
            environment: { type: 'string' },
            knowledgeVersion: {
              type: 'object',
              properties: {
                rules: { type: 'string' },
                tables: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async () => {
      return {
        name: 'KIS견적 AI ERP Backend',
        version: '1.0.0',
        description: 'Evidence-based Industrial Estimation System',
        apiVersion: config.apiVersion,
        environment: config.nodeEnv,
        knowledgeVersion: {
          rules: config.knowledge.rulesVersion,
          tables: config.knowledge.tablesVersion,
        },
      };
    },
  });

  // ========================================
  // API 라우트 등록
  // ========================================

  await app.register(
    async (fastify) => {
      await fastify.register(estimateRoutes);
      await fastify.register(calendarRoutes);
      await fastify.register(emailRoutes);
      await fastify.register(drawingRoutes);
      await fastify.register(settingsRoutes);
      await fastify.register(adminRoutes);
      await fastify.register(adminKnowledgeRoutes);
    },
    { prefix: config.apiBasePath }
  );

  // ========================================
  // 404 핸들러
  // ========================================

  app.setNotFoundHandler({
    preHandler: app.rateLimit(),
  }, (request, reply) => {
    reply.status(404).send({
      code: 'NOT_FOUND',
      message: `Route ${request.method}:${request.url} not found`,
      timestamp: new Date().toISOString(),
    });
  });

  // ========================================
  // 서버 시작 전 초기화
  // ========================================

  app.addHook('onReady', async () => {
    console.log('🚀 Initializing KIS ERP Backend...');

    try {
      // 치수표 초기화 (레거시)
      console.log('📊 Loading legacy size tables...');
      initSizeTables();

      // 새 지식 캐시 초기화
      console.log('🧠 Loading knowledge cache...');
      await loadActiveKnowledge(prisma);

      // 데이터베이스 연결 확인
      console.log('🔗 Testing database connection...');
      await prisma.$queryRaw`SELECT 1`;

      // 멱등성 키 정리 작업 스케줄링
      console.log('🧹 Starting idempotency key cleanup job...');
      await scheduleIdempotencyCleanup(prisma);

      console.log('✅ KIS ERP Backend initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize KIS ERP Backend:', error);
      throw error;
    }
  });

  return app;
}

// ============================================
// 타입 확장
// ============================================

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}