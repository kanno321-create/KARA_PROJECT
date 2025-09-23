import { PrismaClient } from '@prisma/client';
import type { EstimateRequest, EstimateResponse, EnclosureResult } from '../lib/validators.js';
import { validateBrandRules } from '../lib/brand-rules.js';
import { calculateEnclosureSize, validateMixedBrand } from '../lib/enclosure-rules.js';
import { generateEvidence, collectUsedDimensions } from '../lib/evidence.js';
import { errors } from '../lib/errors.js';
import { config } from '../config.js';

// ============================================
// 견적 서비스
// ============================================

export class EstimateService {
  constructor(private prisma: PrismaClient) {}

  // ========================================
  // 견적 검증
  // ========================================

  async validateEstimate(request: EstimateRequest): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const validationErrors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. 브랜드 규칙 검증
      validateBrandRules(request);

      // 2. 혼합 브랜드 검증
      const settings = await this.getSettings();
      validateMixedBrand(request, settings.rules.allowMixedBrand);

      // 3. 접근성 검증 (부속자재)
      this.validateAccessories(request);

      // 성공
      return {
        isValid: true,
        errors: [],
        warnings,
      };

    } catch (error: any) {
      if (error.code) {
        validationErrors.push(error.message);
      } else {
        validationErrors.push('알 수 없는 검증 오류가 발생했습니다.');
      }

      return {
        isValid: false,
        errors: validationErrors,
        warnings,
      };
    }
  }

  // ========================================
  // 견적 생성
  // ========================================

  async createEstimate(request: EstimateRequest): Promise<EstimateResponse> {
    try {
      // 1. 검증
      const validation = await this.validateEstimate(request);
      if (!validation.isValid) {
        throw errors.invalidInput(validation.errors.join(', '));
      }

      // 2. 외함 크기 계산
      const enclosure = calculateEnclosureSize(request);

      // 3. 견적 생성
      const estimate = await this.prisma.estimate.create({
        data: {
          brand: request.brand,
          form: request.form,
          installation: request.installation,
          device: request.device,
          main: request.main,
          branches: request.branches,
          accessories: request.accessories,
          enclosure: enclosure,
          status: 'validated',
        },
      });

      // 4. 증거 패키지 생성
      const usedDimensions = collectUsedDimensions(request);
      const evidenceData = generateEvidence(estimate.id, request, usedDimensions);

      await this.prisma.evidence.create({
        data: {
          ...evidenceData,
          estimateId: estimate.id,
          tables: evidenceData.tables,
          snapshot: evidenceData.snapshot,
          version: evidenceData.version,
        },
      });

      // 5. 감사 로그 생성
      await this.createAuditLog('CREATE_ESTIMATE', request, 'success');

      // 6. 응답 변환
      return this.toEstimateResponse(estimate);

    } catch (error: any) {
      // 감사 로그 (실패)
      await this.createAuditLog('CREATE_ESTIMATE', request, 'failed');

      // KISError인 경우 422로 ABSTAIN 처리
      if (error.code === 'NEED_KNOWLEDGE_UPDATE') {
        await this.createAbstainRequest(request, error);
        throw error; // 422 ABSTAIN으로 전달
      }

      throw error;
    }
  }

  // ========================================
  // 견적 조회
  // ========================================

  async getEstimate(id: string): Promise<EstimateResponse | null> {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id },
      include: {
        evidence: true,
      },
    });

    if (!estimate) {
      return null;
    }

    return this.toEstimateResponse(estimate);
  }

  // ========================================
  // 견적 목록 조회
  // ========================================

  async getEstimates(params: {
    page?: number;
    limit?: number;
    brand?: string;
    status?: string;
  }): Promise<{
    estimates: EstimateResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.brand) where.brand = params.brand;
    if (params.status) where.status = params.status;

    const [estimates, total] = await Promise.all([
      this.prisma.estimate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { evidence: true },
      }),
      this.prisma.estimate.count({ where }),
    ]);

    return {
      estimates: estimates.map(e => this.toEstimateResponse(e)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ========================================
  // 견적 삭제
  // ========================================

  async deleteEstimate(id: string): Promise<void> {
    const estimate = await this.prisma.estimate.findUnique({ where: { id } });
    if (!estimate) {
      throw errors.notFound('견적', id);
    }

    await this.prisma.estimate.delete({ where: { id } });
    await this.createAuditLog('DELETE_ESTIMATE', { estimateId: id }, 'success');
  }

  // ========================================
  // 증거 패키지 조회
  // ========================================

  async getEvidence(estimateId: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { estimateId },
      include: {
        estimate: true,
      },
    });

    if (!evidence) {
      throw errors.notFound('증거 패키지', estimateId);
    }

    return evidence;
  }

  // ========================================
  // ABSTAIN 요청 생성
  // ========================================

  private async createAbstainRequest(request: EstimateRequest, error: any): Promise<void> {
    // 일시적인 견적 생성 (status: failed)
    const estimate = await this.prisma.estimate.create({
      data: {
        brand: request.brand,
        form: request.form,
        installation: request.installation,
        device: request.device,
        main: request.main,
        branches: request.branches,
        accessories: request.accessories,
        status: 'failed',
      },
    });

    // ABSTAIN 큐에 추가
    await this.prisma.abstain.create({
      data: {
        estimateId: estimate.id,
        requestPath: error.path || 'unknown',
        missingData: error.message,
        suggestion: error.hint || '대표님께 질문드립니다.',
        status: 'pending',
      },
    });

    await this.createAuditLog('ABSTAIN_QUESTION', { error: error.message, path: error.path }, 'abstain');
  }

  // ========================================
  // 부속자재 검증
  // ========================================

  private validateAccessories(request: EstimateRequest): void {
    if (request.accessories.enabled && (!request.accessories.items || request.accessories.items.length === 0)) {
      throw errors.accessoryConflict();
    }

    if (!request.accessories.enabled && request.accessories.items && request.accessories.items.length > 0) {
      throw errors.accessoryConflict();
    }
  }

  // ========================================
  // 설정 조회
  // ========================================

  private async getSettings() {
    const settings = await this.prisma.setting.findFirst();
    if (!settings) {
      // 기본 설정 생성
      return await this.prisma.setting.create({
        data: {
          defaultBrand: config.defaults.brand,
          defaultForm: config.defaults.form,
          defaultLocation: config.defaults.location,
          defaultMount: config.defaults.mount,
          rules: {
            singleBrand: true,
            antiPoleMistake: true,
            allowMixedBrand: config.features.allowMixedBrand,
            require3Gates: true,
            economicByDefault: true,
          },
          knowledgeVersion: {
            rules: config.knowledge.rulesVersion,
            tables: config.knowledge.tablesVersion,
            updated: new Date().toISOString(),
          },
        },
      });
    }
    return settings;
  }

  // ========================================
  // 감사 로그 생성
  // ========================================

  private async createAuditLog(action: string, payload: any, result: 'success' | 'failed' | 'abstain'): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actor: 'system',
          action,
          payload,
          result,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  // ========================================
  // 응답 변환
  // ========================================

  private toEstimateResponse(estimate: any): EstimateResponse {
    return {
      id: estimate.id,
      brand: estimate.brand,
      form: estimate.form,
      installation: estimate.installation,
      device: estimate.device,
      main: estimate.main,
      branches: estimate.branches,
      accessories: estimate.accessories,
      enclosure: estimate.enclosure,
      status: estimate.status,
      createdAt: estimate.createdAt.toISOString(),
      updatedAt: estimate.updatedAt.toISOString(),
    };
  }

  // ========================================
  // ABSTAIN 큐 관리
  // ========================================

  async getAbstainQueue(status?: string) {
    const where = status ? { status } : {};

    return await this.prisma.abstain.findMany({
      where,
      include: {
        estimate: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveAbstain(id: string, resolution: { providedData: any; updatedVersion: string }) {
    const abstain = await this.prisma.abstain.findUnique({ where: { id } });
    if (!abstain) {
      throw errors.notFound('ABSTAIN 요청', id);
    }

    await this.prisma.abstain.update({
      where: { id },
      data: {
        status: 'resolved',
        resolution,
        resolvedAt: new Date(),
      },
    });

    await this.createAuditLog('RESOLVE_ABSTAIN', { abstainId: id, resolution }, 'success');
  }
}