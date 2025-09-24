// ============================================
// ABSTAIN Queue Service
// 지식 부족 요청 관리 및 해결
// ============================================

import type { PrismaClient } from '@prisma/client';
import { errors } from '../lib/errors.js';
import { toError, toJson } from '../lib/json-utils.js';

export interface AbstainRequest {
  estimateId?: string;
  requestPath: string;
  missingData: string;
  suggestion: string;
}

export interface AbstainResolution {
  providedData: any;
  updatedVersion: string;
}

export class AbstainService {
  constructor(private prisma: PrismaClient) {}

  // ========================================
  // ABSTAIN 요청 생성
  // ========================================

  async createAbstainRequest(request: AbstainRequest) {
    try {
      const abstain = await this.prisma.abstain.create({
        data: {
          estimateId: request.estimateId,
          requestPath: request.requestPath,
          missingData: request.missingData,
          suggestion: request.suggestion,
          status: 'pending',
        },
      });

      return abstain;
    } catch (error) {
      throw errors.internal(`ABSTAIN 요청 생성 실패: ${toError(error).message}`);
    }
  }

  // ========================================
  // ABSTAIN 큐 조회
  // ========================================

  async getAbstainQueue(status?: string) {
    try {
      const where = status ? { status } : {};

      const abstains = await this.prisma.abstain.findMany({
        where,
        include: {
          estimate: {
            select: {
              id: true,
              brand: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return abstains;
    } catch (error) {
      throw errors.internal(`ABSTAIN 큐 조회 실패: ${toError(error).message}`);
    }
  }

  // ========================================
  // ABSTAIN 요청 조회 (단일)
  // ========================================

  async getAbstainRequest(id: string) {
    try {
      const abstain = await this.prisma.abstain.findUnique({
        where: { id },
        include: {
          estimate: true,
        },
      });

      if (!abstain) {
        throw errors.notFound('ABSTAIN 요청', id);
      }

      return abstain;
    } catch (error) {
      const err = toError(error);
      if ((err as any).statusCode) throw error;
      throw errors.internal(`ABSTAIN 요청 조회 실패: ${err.message}`);
    }
  }

  // ========================================
  // ABSTAIN 요청 해결
  // ========================================

  async resolveAbstainRequest(id: string, resolution: AbstainResolution) {
    try {
      const abstain = await this.getAbstainRequest(id);

      if (abstain.status !== 'pending') {
        throw errors.conflict(
          `ABSTAIN 요청이 이미 ${abstain.status} 상태입니다`,
          'status 필드를 확인해 주세요.'
        );
      }

      // ABSTAIN 요청 해결로 업데이트
      const updatedAbstain = await this.prisma.abstain.update({
        where: { id },
        data: {
          status: 'resolved',
          resolution: toJson(resolution),
          resolvedAt: new Date(),
        },
      });

      // 관련된 견적이 있다면 상태 업데이트 고려
      if (abstain.estimateId) {
        await this.prisma.estimate.update({
          where: { id: abstain.estimateId },
          data: {
            status: 'validated', // 지식이 제공되었으므로 검증 상태로 변경
            updatedAt: new Date(),
          },
        });
      }

      return updatedAbstain;
    } catch (error) {
      const err = toError(error);
      if ((err as any).statusCode) throw error;
      throw errors.internal(`ABSTAIN 요청 해결 실패: ${err.message}`);
    }
  }

  // ========================================
  // ABSTAIN 요청 무시 (ignore)
  // ========================================

  async ignoreAbstainRequest(id: string, reason?: string) {
    try {
      const abstain = await this.getAbstainRequest(id);

      if (abstain.status !== 'pending') {
        throw errors.conflict(
          `ABSTAIN 요청이 이미 ${abstain.status} 상태입니다`,
          'status 필드를 확인해 주세요.'
        );
      }

      const updatedAbstain = await this.prisma.abstain.update({
        where: { id },
        data: {
          status: 'ignored',
          resolution: reason ? toJson({ reason }) : undefined,
          resolvedAt: new Date(),
        },
      });

      return updatedAbstain;
    } catch (error) {
      const err = toError(error);
      if ((err as any).statusCode) throw error;
      throw errors.internal(`ABSTAIN 요청 무시 실패: ${err.message}`);
    }
  }

  // ========================================
  // 통계 및 분석
  // ========================================

  async getAbstainStats() {
    try {
      const stats = await this.prisma.abstain.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      });

      const pathStats = await this.prisma.abstain.groupBy({
        by: ['requestPath'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      });

      return {
        statusBreakdown: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        topMissingPaths: pathStats.map(stat => ({
          path: stat.requestPath,
          count: stat._count.id,
        })),
      };
    } catch (error) {
      throw errors.internal(`ABSTAIN 통계 조회 실패: ${toError(error).message}`);
    }
  }

  // ========================================
  // 헬퍼 함수: ABSTAIN 생성용
  // ========================================

  static createAbstainError(
    requestPath: string,
    missingData: string,
    suggestion: string,
    estimateId?: string
  ) {
    return {
      code: 'ABSTAIN_KNOWLEDGE_MISSING',
      message: `지식 부족으로 요청을 처리할 수 없습니다: ${missingData}`,
      path: requestPath,
      hint: suggestion,
      metadata: {
        abstainRequest: {
          estimateId,
          requestPath,
          missingData,
          suggestion,
        },
      },
    };
  }
}