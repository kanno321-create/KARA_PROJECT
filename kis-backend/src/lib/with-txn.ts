import type { PrismaClient } from '@prisma/client';

// ============================================
// 트랜잭션 헬퍼
// ============================================

export async function withTxn<T>(
  prisma: PrismaClient,
  fn: (tx: PrismaClient) => Promise<T>,
  opts?: { timeoutMs?: number }
): Promise<T> {
  // 필요시 타임아웃/재시도 정책 고려(기본은 1회)
  return prisma.$transaction(async (tx) => {
    // tx는 PrismaClient 프록시
    return fn(tx);
  }, {
    timeout: opts?.timeoutMs || 30000, // 30초 기본 타임아웃
  });
}