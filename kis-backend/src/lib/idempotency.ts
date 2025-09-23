import type { PrismaClient } from '@prisma/client';
import { normalizeRequestBody, stableStringify, sha256 } from './normalize.js';

// ============================================
// 멱등성 처리
// ============================================

type IdemScope = 'POST /v1/estimate/create';

export async function handleIdempotencyStart(
  prisma: PrismaClient,
  opts: {
    key?: string;
    scope: IdemScope;
    actor?: string;
    body: unknown;
  }
) {
  const { key, scope, actor, body } = opts;
  if (!key) return { mode: 'BYPASS' as const };

  const normalized = normalizeRequestBody(body);
  const reqHash = sha256(stableStringify(normalized));

  const found = await prisma.idempotencyKey.findUnique({ where: { key } });
  if (found) {
    // 키 재사용
    if (found.reqHash !== reqHash || found.scope !== scope) {
      const err: any = new Error('Idempotency body mismatch');
      err.statusCode = 409;
      err.code = 'IDEMPOTENCY_BODY_MISMATCH';
      err.hint = 'Same Idempotency-Key must be used with the same request body and scope.';
      throw err;
    }
    // 동일 바디 → 저장된 응답 재생산
    await prisma.idempotencyKey.update({
      where: { key },
      data: { replayedAt: new Date() }
    });
    return { mode: 'REPLAY' as const, response: found.response };
  }

  // 새 키: 선점 행 생성(낙관적)
  await prisma.idempotencyKey.create({
    data: {
      key,
      scope,
      actor: actor ?? null,
      reqHash,
      response: {}, // 임시(완료 시 갱신)
      status: 'STORED',
    },
  });

  return { mode: 'STORE' as const, reqHash };
}

export async function handleIdempotencyFinish(
  prisma: PrismaClient,
  opts: {
    key?: string;
    response: any;
  }
) {
  if (!opts.key) return;

  // 응답을 정규화하여 바이트 동일성 보장
  const normalizedResponse = JSON.parse(stableStringify(opts.response));

  await prisma.idempotencyKey.update({
    where: { key: opts.key },
    data: {
      response: normalizedResponse,
    },
  });
}