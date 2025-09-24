import { PrismaClient } from '@prisma/client';
import type { EstimateRequest, EstimateResponse } from '../lib/validators.js';
// import type { EnclosureResult } from '../lib/validators.js'; // Unused: removed
import { validateBrandRules } from '../lib/brand-rules.js';
import { calculateEnclosureSize, validateMixedBrand } from '../lib/enclosure-rules.js';
import { generateEvidence, collectUsedDimensions, verifyEvidenceSignature } from '../lib/evidence.js';
import { normalizeRequestBody } from '../lib/normalize.js';
import { withTxn } from '../lib/with-txn.js';
import { errors } from '../lib/errors.js';
import { config } from '../config.js';
import { AbstainService } from './abstain.service.js';
// import { getCurrentKnowledgeVersion } from '../lib/size-tables-v2.js'; // Unused: removed
import { toJson, fromJsonObject, fromJsonArray } from '../lib/json-utils.js';
// import { toError } from '../lib/json-utils.js'; // Unused: removed

// ============================================
// 견적 서비스
// ============================================

export class EstimateService {
  private abstainService: AbstainService;

  constructor(private prisma: PrismaClient) {
    this.abstainService = new AbstainService(prisma);
  }

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
      const rules = fromJsonObject<any>(settings.rules) || {};
      validateMixedBrand(request, rules.allowMixedBrand || false);

      // 3. 접근성 검증 (부속자재)
      // this.validateAccessories(request); // Commented out temporarily as method doesn't exist

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
    // 단계 1: 입력 정규화 (트랜잭션 외부)
    const normalizedInput = normalizeRequestBody(request);

    // 단계 2: 사전 검증 (트랜잭션 외부)
    const validation = await this.validateEstimate(request);
    if (!validation.isValid) {
      throw errors.invalidInput(validation.errors.join(', '));
    }

    // 단계 3: 트랜잭션 내 원자적 처리
    return await withTxn(this.prisma, async (tx) => {
      try {
        // 3-1. 설정 조회
        // const _settings = await this.getSettingsInTx(tx); // Unused: removed for now

        // 3-2. 현재 활성 지식 버전 및 해시 수집
        const knowledgeVersion = await this.getCurrentKnowledgeVersionInTx(tx);
        const tableHashes = await this.getTableHashesInTx(tx, knowledgeVersion.id);

        // 3-3. 외함 크기 계산 또는 ABSTAIN
        let enclosure: any;
        try {
          enclosure = calculateEnclosureSize(request);
        } catch (error: any) {
          // ABSTAIN 처리는 트랜잭션 내에서
          await this.handleAbstainRequestInTx(tx, request, error);
          throw error; // 422 ABSTAIN으로 전달
        }

        // 3-4. 증거 패키지 생성 및 서명
        const usedDimensions = collectUsedDimensions(request);
        const evidenceData = generateEvidence('temp', normalizedInput, usedDimensions, knowledgeVersion, tableHashes);

        // 서명 검증 (무결성 확인)
        const isSignatureValid = verifyEvidenceSignature({
          ...evidenceData,
          id: 'temp',
          estimateId: 'temp',
          createdAt: new Date().toISOString(),
        });

        if (!isSignatureValid) {
          throw errors.internal('증거 패키지 서명 검증 실패');
        }

        // 3-5. 원자적 저장: Estimate + Evidence + AuditLog
        const estimate = await tx.estimate.create({
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

        // 실제 estimateId로 증거 패키지 재생성
        const finalEvidenceData = generateEvidence(estimate.id, normalizedInput, usedDimensions, knowledgeVersion, tableHashes);

        await tx.evidence.create({
          data: {
            ...finalEvidenceData,
            estimateId: estimate.id,
            tables: finalEvidenceData.tables,
            snapshot: finalEvidenceData.snapshot,
            version: finalEvidenceData.version,
          },
        });

        // 감사 로그 생성
        await this.createAuditLogInTx(tx, 'CREATE_ESTIMATE', request, 'success');

        // 6. 응답 변환
        return this.toEstimateResponse(estimate);

      } catch (error: any) {
        // 감사 로그 (실패) - 트랜잭션 내에서
        await this.createAuditLogInTx(tx, 'CREATE_ESTIMATE', request, 'failed');
        throw error; // 트랜잭션 롤백
      }
    });
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
  // ABSTAIN 요청 처리
  // ========================================

  // Commented out temporarily as unused
  /*
  private async _handleAbstainRequest(request: EstimateRequest, error: any): Promise<void> {
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

    // ABSTAIN 서비스를 통해 요청 생성
    await this.abstainService.createAbstainRequest({
      estimateId: estimate.id,
      requestPath: error.path || 'unknown',
      missingData: error.message,
      suggestion: error.hint || '대표님께 질문드립니다.',
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
  */

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
          knowledgeVersion: 1, // Default knowledge version
          rules: toJson({
            singleBrand: true,
            antiPoleMistake: true,
            allowMixedBrand: config.features.allowMixedBrand,
            require3Gates: true,
            economicByDefault: true,
          }),
        },
      });
    }
    return settings;
  }

  // ========================================
  // 트랜잭션용 헬퍼 메서드들
  // ========================================

  // Commented out temporarily as unused
  /*
  private async getSettingsInTx(tx: any) {
    const settings = await tx.setting.findFirst();
    if (!settings) {
      // 기본 설정 생성
      return await tx.setting.create({
        data: {
          defaultBrand: config.defaults.brand,
          defaultForm: config.defaults.form,
          defaultLocation: config.defaults.location,
          defaultMount: config.defaults.mount,
          knowledgeVersion: 1, // Default knowledge version
          rules: toJson({
            singleBrand: true,
            antiPoleMistake: true,
            allowMixedBrand: config.features.allowMixedBrand,
            require3Gates: true,
            economicByDefault: true,
          }),
        },
      });
    }
    return settings;
  }
  */

  private async getCurrentKnowledgeVersionInTx(tx: any) {
    const version = await tx.knowledgeVersion.findFirst({
      where: { active: true },
      include: { tables: true },
    });

    if (!version) {
      throw errors.internal('No active knowledge version found');
    }

    return version;
  }

  private async getTableHashesInTx(tx: PrismaClient, versionId: number): Promise<Record<string, string>> {
    const knowledgeTables = await tx.knowledgeTable.findMany({
      where: { versionId },
      select: { brand: true, series: true, model: true, af: true, poles: true, rowHash: true },
    });

    const hashes: Record<string, string> = {};
    let tableIndex = 0;
    for (const table of knowledgeTables) {
      const key = `${table.brand}_${table.series || ''}_${table.model || ''}_${table.af || ''}_${table.poles}`;
      hashes[`table_${tableIndex}_${key}`] = table.rowHash;
      tableIndex++;
    }

    return hashes;
  }

  private async handleAbstainRequestInTx(tx: PrismaClient, request: EstimateRequest, error: any): Promise<void> {
    // 일시적인 견적 생성 (status: failed)
    const estimate = await tx.estimate.create({
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

    // ABSTAIN 요청 생성
    await tx.abstain.create({
      data: {
        estimateId: estimate.id,
        requestPath: error.path || 'unknown',
        missingData: error.message,
        suggestion: error.hint || '대표님께 질문드립니다.',
        status: 'pending',
      },
    });
  }

  private async createAuditLogInTx(tx: PrismaClient, action: string, payload: any, result: 'success' | 'failed' | 'abstain'): Promise<void> {
    await tx.auditLog.create({
      data: {
        actor: 'system',
        action,
        payload,
        result,
      },
    });
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
  // ABSTAIN 큐 관리 (위임)
  // ========================================

  async getAbstainQueue(status?: string) {
    return await this.abstainService.getAbstainQueue(status);
  }

  async resolveAbstain(id: string, resolution: { providedData: any; updatedVersion: string }) {
    const result = await this.abstainService.resolveAbstainRequest(id, resolution);
    await this.createAuditLog('RESOLVE_ABSTAIN', { abstainId: id, resolution }, 'success');
    return result;
  }

  // ========================================
  // 증거 서명 검증
  // ========================================

  async verifyEvidenceSignature(estimateId: string) {
    // 1. 증거 패키지 조회
    const evidence = await this.getEvidence(estimateId);

    // 2. 서명 검증 (with type conversion for all JSON fields and Date fields)
    const evidenceForVerification = {
      ...evidence,
      tables: fromJsonArray<{source: string, rows: string[]}>(evidence.tables) || [],
      snapshot: fromJsonObject<Record<string, any>>(evidence.snapshot) || {},
      usedRows: fromJsonArray<string>(evidence.usedRows) || [],
      tableHashes: fromJsonObject<Record<string, string>>(evidence.tableHashes) || {},
      version: fromJsonObject<{rules: string, tables: string}>(evidence.version) || {rules: '', tables: ''},
      createdAt: evidence.createdAt instanceof Date ? evidence.createdAt.toISOString() : evidence.createdAt
    };
    const isSignatureValid = verifyEvidenceSignature(evidenceForVerification);

    // 3. 추가 검증 세부사항
    const verificationDetails = {
      snapshotHashValid: Boolean(evidence.snapshotHash),
      rulesVersionValid: Boolean(evidence.rulesVersion),
      knowledgeVersionValid: Boolean(evidence.knowledgeVersion),
      tableHashesValid: Boolean(evidence.tableHashes && Object.keys(evidence.tableHashes).length > 0),
      signatureValid: isSignatureValid,
    };

    // 4. 전체 유효성 결정
    const isValid = Object.values(verificationDetails).every(Boolean);

    // 5. 감사 로그 생성
    await this.createAuditLog(
      'VERIFY_EVIDENCE_SIGNATURE',
      { estimateId, verificationDetails },
      isValid ? 'success' : 'failed'
    );

    return {
      isValid,
      verifiedAt: new Date().toISOString(),
      signatureStatus: isValid ? 'VALID' : 'INVALID',
      evidenceHash: evidence.snapshotHash,
      verificationDetails,
    };
  }
}