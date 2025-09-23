import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'contract-tests',
    include: ['test/contract/**/*.test.ts'],
    testTimeout: 30000, // 30 seconds for API calls
    hookTimeout: 30000,
    setupFiles: [],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test-contract.db',
      API_KEY: 'test-api-key-123',
      EVIDENCE_SECRET: 'test-evidence-secret-for-contract-tests-12345',
      PORT: '3001'
    },
    pool: 'forks', // Use separate processes for isolation
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'test/**/*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  }
});