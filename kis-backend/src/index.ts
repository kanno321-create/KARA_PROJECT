import { createApp } from './app.js';
import { config } from './config.js';

// ============================================
// 서버 시작
// ============================================

async function start() {
  try {
    console.log('🏭 Starting KIS견적 AI ERP Backend...');
    console.log(`📍 Environment: ${config.nodeEnv}`);
    console.log(`🔧 API Version: ${config.apiVersion}`);
    console.log(`📊 Knowledge Version: rules:${config.knowledge.rulesVersion}, tables:${config.knowledge.tablesVersion}`);

    // 앱 생성
    const app = await createApp();

    // 서버 시작
    const address = await app.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    console.log(`🚀 Server listening on ${address}`);
    console.log(`📖 API Documentation: ${address}/docs`);
    console.log(`🔍 Health Check: ${address}/health`);
    console.log(`ℹ️  API Info: ${address}/info`);

    // 프로세스 종료 신호 처리
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

        try {
          await app.close();
          console.log('✅ Server shut down gracefully');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    });

    // 예외 처리
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// 서버 시작
start();