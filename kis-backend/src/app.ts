import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { config } from './config.js';
import { initSizeTables } from './lib/size-tables.js';
import { loadActiveKnowledge } from './lib/size-tables-v2.js';
import { registerSecurityMiddlewares } from './lib/security-middleware.js';
import { scheduleIdempotencyCleanup } from './jobs/cleanup-idempotency.js';

import errorsPlugin from './plugins/errors.js';
import contentTypeGuard from './plugins/contentTypeGuard.js';
import qtyCountPolicy from './plugins/qtyCountPolicy.js';

import { estimateRoutes } from './routes/estimate.js';
import { createObservabilityRoutes } from './lib/observability.js';
import { calendarRoutes } from './routes/calendar.js';
import { emailRoutes } from './routes/email.js';
import { drawingRoutes } from './routes/drawing.js';
import { settingsRoutes } from './routes/settings.js';
import { adminRoutes } from './routes/admin.js';
import { adminKnowledgeRoutes } from './routes/admin-knowledge.js';

export async function createApp() {
  if (!config.security.evidenceSecret) {
    throw new Error('EVIDENCE_SECRET environment variable is required for production');
  }

  const app = Fastify({
    logger: config.logging.pretty
      ? {
          level: config.logging.level,
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname'
            }
          }
        }
      : {
          level: config.logging.level
        },
    bodyLimit: config.maxJsonSize
  });

  registerSecurityMiddlewares(app);

  await app.register(errorsPlugin);
  await app.register(contentTypeGuard);
  await app.register(qtyCountPolicy);

  await app.register(import('@fastify/cors'), {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (config.security.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true
  });

  await app.register(import('@fastify/rate-limit'), {
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

  await app.register(import('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'KIS ERP API',
        description: 'Evidence-based Industrial Estimation System',
        version: '1.0.0',
        contact: {
          name: 'KARA PROJECT Team',
          email: 'support@kara-project.com'
        }
      },
      servers: [
        {
          url: `http://localhost:${config.port}`,
          description: 'Development server'
        }
      ],
      tags: [
        { name: 'estimate', description: 'Estimate operations' },
        { name: 'calendar', description: 'Calendar operations' },
        { name: 'email', description: 'Email operations' },
        { name: 'drawings', description: 'Drawing operations' },
        { name: 'settings', description: 'Settings operations' },
        { name: 'admin', description: 'Admin operations' },
        { name: 'abstain', description: 'ABSTAIN queue operations' }
      ]
    }
  });

  await app.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header,
    transformSpecification: (swaggerObject: any) => swaggerObject,
    transformSpecificationClone: true
  });

  const prisma = new PrismaClient({
    log: config.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error']
  });
  app.decorate('prisma', prisma);

  const healthSchema = {
    summary: 'Health check',
    description: 'Returns service readiness information.',
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
              sangdoCount: { type: 'number' }
            }
          }
        }
      }
    }
  };

  const healthHandler = async () => {
    let databaseStatus = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      databaseStatus = 'error';
    }

    const { getCacheInfo } = await import('./lib/size-tables.js');
    const sizeTablesInfo = getCacheInfo();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: databaseStatus,
      sizeTables: {
        loaded: sizeTablesInfo.isLoaded,
        lsCount: sizeTablesInfo.lsCount || 0,
        sangdoCount: sizeTablesInfo.sangdoCount || 0
      }
    };
  };

  app.get('/health', { schema: healthSchema }, healthHandler);
  app.get('/v1/health', { schema: healthSchema }, healthHandler);

  const infoSchema = {
    summary: 'API info',
    description: 'Returns API metadata and knowledge versions.',
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
              tables: { type: 'string' }
            }
          }
        }
      }
    }
  };

  const infoHandler = async () => ({
    name: 'KIS ERP Backend',
    version: '1.0.0',
    description: 'Evidence-based Industrial Estimation System',
    apiVersion: config.apiVersion,
    environment: config.nodeEnv,
    knowledgeVersion: {
      rules: config.knowledge.rulesVersion,
      tables: config.knowledge.tablesVersion
    }
  });

  app.get('/info', { schema: infoSchema }, infoHandler);
  app.get('/v1/info', { schema: infoSchema }, infoHandler);

  await app.register(async (fastify) => {
    await fastify.register(estimateRoutes);
    createObservabilityRoutes(fastify);
    await fastify.register(calendarRoutes);
    await fastify.register(emailRoutes);
    await fastify.register(drawingRoutes);
    await fastify.register(settingsRoutes);
    await fastify.register(adminRoutes);
    await fastify.register(adminKnowledgeRoutes);
  }, { prefix: config.apiBasePath });

  app.setNotFoundHandler({
    preHandler: app.rateLimit()
  }, (request, reply) => {
    reply.status(404).send({
      code: 'NOT_FOUND',
      message: `Route ${request.method}:${request.url} not found`,
      timestamp: new Date().toISOString()
    });
  });

  app.addHook('onReady', async () => {
    console.log('[startup] Initializing KIS ERP Backend...');

    try {
      console.log('[startup] Loading legacy size tables...');
      initSizeTables();

      console.log('[startup] Loading knowledge cache...');
      await loadActiveKnowledge(prisma);

      console.log('[startup] Testing database connection...');
      await prisma.$queryRaw`SELECT 1`;

      console.log('[startup] Scheduling idempotency cleanup job...');
      await scheduleIdempotencyCleanup(prisma);

      console.log('[startup] Initialization complete.');
    } catch (error) {
      console.error('[startup] Failed to initialize KIS ERP Backend:', error);
      throw error;
    }
  });

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
