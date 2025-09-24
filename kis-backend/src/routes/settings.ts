import type { FastifyInstance } from 'fastify';
import { SettingsService } from '../services/settings.service.js';
import { SettingsJSONSchema, SettingsUpdateJSONSchema } from '../lib/json-schemas.js';
// import { errors } from '../lib/errors.js'; // Unused: removed

// ============================================
// 설정 라우트
// ============================================

export async function settingsRoutes(fastify: FastifyInstance) {
  const settingsService = new SettingsService(fastify.prisma);

  // ========================================
  // GET /v1/settings - 설정 조회 (싱글톤)
  // ========================================

  fastify.get('/settings', {
    schema: {
      summary: '시스템 설정 조회',
      description: '현재 시스템 설정을 조회합니다',
      tags: ['settings'],
      response: {
        200: SettingsJSONSchema,
      },
    },
    handler: async () => {
      return await settingsService.getSettings();
    },
  });

  // ========================================
  // PUT /v1/settings - 설정 업데이트
  // ========================================

  fastify.put('/settings', {
    schema: {
      summary: '시스템 설정 업데이트',
      description: '시스템 설정을 업데이트합니다',
      tags: ['settings'],
      body: SettingsUpdateJSONSchema,
      response: {
        200: SettingsJSONSchema,
        400: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            path: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const settings = await settingsService.updateSettings(request.body as any);
        return settings;
      } catch (error: any) {
        if (error.statusCode === 400) {
          reply.status(400);
          return error.toJSON();
        }
        throw error;
      }
    },
  });

  // ========================================
  // POST /v1/settings/reset - 설정 초기화
  // ========================================

  fastify.post('/settings/reset', {
    schema: {
      summary: '설정 초기화',
      description: '시스템 설정을 기본값으로 초기화합니다',
      tags: ['settings'],
      response: {
        200: SettingsJSONSchema,
      },
    },
    handler: async () => {
      return await settingsService.resetSettings();
    },
  });

  // ========================================
  // GET /v1/settings/export - 설정 내보내기
  // ========================================

  fastify.get('/settings/export', {
    schema: {
      summary: '설정 내보내기',
      description: '현재 설정을 JSON 형태로 내보냅니다',
      tags: ['settings'],
      response: {
        200: {
          type: 'object',
          properties: {
            settings: SettingsJSONSchema,
            exportedAt: { type: 'string' },
            version: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      const exportData = await settingsService.exportSettings();

      reply
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', 'attachment; filename="kis-settings.json"');

      return exportData;
    },
  });

  // ========================================
  // POST /v1/settings/import - 설정 가져오기
  // ========================================

  fastify.post('/settings/import', {
    schema: {
      summary: '설정 가져오기',
      description: 'JSON 파일에서 설정을 가져옵니다',
      tags: ['settings'],
      body: {
        type: 'object',
        properties: {
          settings: SettingsUpdateJSONSchema,
          version: { type: 'string' },
        },
        required: ['settings'],
      },
      response: {
        200: SettingsJSONSchema,
        400: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            path: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const settings = await settingsService.importSettings(request.body as any);
        return settings;
      } catch (error: any) {
        if (error.statusCode === 400) {
          reply.status(400);
          return error.toJSON();
        }
        throw error;
      }
    },
  });

  // ========================================
  // GET /v1/settings/rules - 규칙 설정 조회
  // ========================================

  fastify.get('/settings/rules', {
    schema: {
      summary: '규칙 설정 조회',
      description: '비즈니스 규칙 설정을 조회합니다',
      tags: ['settings'],
      response: {
        200: {
          type: 'object',
          properties: {
            singleBrand: { type: 'boolean' },
            antiPoleMistake: { type: 'boolean' },
            allowMixedBrand: { type: 'boolean' },
            require3Gates: { type: 'boolean' },
            economicByDefault: { type: 'boolean' },
          },
        },
      },
    },
    handler: async () => {
      return await settingsService.getRules();
    },
  });

  // ========================================
  // PUT /v1/settings/rules - 규칙 설정 업데이트
  // ========================================

  fastify.put('/settings/rules', {
    schema: {
      summary: '규칙 설정 업데이트',
      description: '비즈니스 규칙 설정을 업데이트합니다',
      tags: ['settings'],
      body: {
        type: 'object',
        properties: {
          singleBrand: { type: 'boolean' },
          antiPoleMistake: { type: 'boolean' },
          allowMixedBrand: { type: 'boolean' },
          require3Gates: { type: 'boolean' },
          economicByDefault: { type: 'boolean' },
        },
      },
      response: {
        200: SettingsJSONSchema,
      },
    },
    handler: async (request) => {
      return await settingsService.updateRules(request.body as any);
    },
  });

  // ========================================
  // GET /v1/settings/knowledge-version - 지식 버전 조회
  // ========================================

  fastify.get('/settings/knowledge-version', {
    schema: {
      summary: '지식 버전 조회',
      description: '현재 지식베이스 버전을 조회합니다',
      tags: ['settings'],
      response: {
        200: {
          type: 'object',
          properties: {
            rules: { type: 'string' },
            tables: { type: 'string' },
            updated: { type: 'string' },
          },
        },
      },
    },
    handler: async () => {
      return await settingsService.getKnowledgeVersion();
    },
  });

  // ========================================
  // PUT /v1/settings/knowledge-version - 지식 버전 업데이트
  // ========================================

  fastify.put('/settings/knowledge-version', {
    schema: {
      summary: '지식 버전 업데이트',
      description: '지식베이스 버전을 업데이트합니다',
      tags: ['settings'],
      body: {
        type: 'object',
        properties: {
          rules: { type: 'string' },
          tables: { type: 'string' },
        },
      },
      response: {
        200: SettingsJSONSchema,
      },
    },
    handler: async (request) => {
      return await settingsService.updateKnowledgeVersion(request.body as any);
    },
  });

  // ========================================
  // GET /v1/settings/defaults - 기본값 조회
  // ========================================

  fastify.get('/settings/defaults', {
    schema: {
      summary: '기본값 설정 조회',
      description: '시스템 기본값 설정을 조회합니다',
      tags: ['settings'],
      response: {
        200: {
          type: 'object',
          properties: {
            defaultBrand: { type: 'string' },
            defaultForm: { type: 'string' },
            defaultLocation: { type: 'string' },
            defaultMount: { type: 'string' },
          },
        },
      },
    },
    handler: async () => {
      return await settingsService.getDefaults();
    },
  });

  // ========================================
  // PUT /v1/settings/defaults - 기본값 업데이트
  // ========================================

  fastify.put('/settings/defaults', {
    schema: {
      summary: '기본값 설정 업데이트',
      description: '시스템 기본값 설정을 업데이트합니다',
      tags: ['settings'],
      body: {
        type: 'object',
        properties: {
          defaultBrand: { type: 'string', enum: ['SANGDO', 'LS', 'MIXED'] },
          defaultForm: { type: 'string', enum: ['ECONOMIC', 'STANDARD'] },
          defaultLocation: { type: 'string', enum: ['INDOOR', 'OUTDOOR'] },
          defaultMount: { type: 'string', enum: ['FLUSH', 'SURFACE'] },
        },
      },
      response: {
        200: SettingsJSONSchema,
      },
    },
    handler: async (request) => {
      return await settingsService.updateDefaults(request.body as any);
    },
  });

  // ========================================
  // GET /v1/settings/validate - 설정 무결성 검사
  // ========================================

  fastify.get('/settings/validate', {
    schema: {
      summary: '설정 무결성 검사',
      description: '현재 설정의 무결성을 검사합니다',
      tags: ['settings'],
      response: {
        200: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean' },
            issues: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
    handler: async () => {
      return await settingsService.validateSettingsIntegrity();
    },
  });
}