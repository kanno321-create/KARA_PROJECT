import type { PrismaClient } from '@prisma/client';

// ============================================
// 멱등성 키 만료/청소 작업
// ============================================

export async function cleanupExpiredIdempotencyKeys(
  prisma: PrismaClient,
  ttlDays: number = 14
): Promise<{ deletedCount: number }> {
  const expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() - ttlDays);

  const result = await prisma.idempotencyKey.deleteMany({
    where: {
      createdAt: {
        lt: expiredDate,
      },
    },
  });

  console.log(`Cleaned up ${result.count} expired idempotency keys older than ${ttlDays} days`);

  return { deletedCount: result.count };
}

// 서버 부팅 시 또는 주기적으로 실행하는 함수
export async function scheduleIdempotencyCleanup(
  prisma: PrismaClient,
  intervalHours: number = 24
): Promise<void> {
  // 초기 청소 실행
  await cleanupExpiredIdempotencyKeys(prisma);

  // 주기적 청소 스케줄 설정
  setInterval(async () => {
    try {
      await cleanupExpiredIdempotencyKeys(prisma);
    } catch (error) {
      console.error('Failed to cleanup idempotency keys:', error);
    }
  }, intervalHours * 60 * 60 * 1000); // 시간을 밀리초로 변환
}