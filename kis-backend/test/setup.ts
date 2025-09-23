// Vitest 테스트 설정 파일
import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  console.log('🧪 Setting up test environment...');

  // 테스트 데이터베이스 마이그레이션
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

  // 테스트 데이터 시딩
  try {
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('✅ Test data seeded');
  } catch (error) {
    console.warn('⚠️ Seeding failed (may be expected):', error);
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');

  // 데이터베이스 연결 종료
  await prisma.$disconnect();

  console.log('✅ Test cleanup completed');
});

// 환경변수 설정
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
process.env.LOG_LEVEL = 'silent';

// 전역 모의 설정
global.console = {
  ...console,
  // 테스트 중 불필요한 로그 억제
  log: process.env.TEST_VERBOSE ? console.log : () => {},
  warn: process.env.TEST_VERBOSE ? console.warn : () => {},
  info: process.env.TEST_VERBOSE ? console.info : () => {},
};