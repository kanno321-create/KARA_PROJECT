import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'integration-tests',
    include: ['test/integration/**/*.test.ts'],
    testTimeout: 60000, // 60 seconds for complex integration flows
    hookTimeout: 60000,
    setupFiles: [],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test-integration.db',
      API_KEY: 'test-api-key-123',
      EVIDENCE_SECRET: 'test-evidence-secret-for-integration-tests-67890',
      PORT: '7000'
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
    },
    // Run integration tests sequentially to avoid conflicts
    maxConcurrency: 1,
    fileParallelism: false
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  }
});
