import 'dotenv/config';

export const config = {
  // Server
  port: parseInt(process.env.PORT || '7000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',

  // API
  apiVersion: process.env.API_VERSION || 'v1',
  apiBasePath: process.env.API_BASE_PATH || '/v1',

  // Features
  features: {
    allowMixedBrand: process.env.ALLOW_MIXED_BRAND === 'true',
    emailSmtp: process.env.EMAIL_SMTP === 'true',
    pdfExport: process.env.PDF_EXPORT === 'true',
  },

  // Rate Limiting
  rateLimit: {
    estimate: parseInt(process.env.RATE_LIMIT_ESTIMATE || '30'),
    default: parseInt(process.env.RATE_LIMIT_DEFAULT || '60'),
  },

  // Knowledge Version
  knowledge: {
    rulesVersion: process.env.RULES_VERSION || 'v1.0',
    tablesVersion: process.env.TABLES_VERSION || 'v1.0',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    pretty: process.env.NODE_ENV !== 'production',
  },

  // Defaults
  defaults: {
    brand: 'SANGDO' as const,
    form: 'ECONOMIC' as const,
    location: 'INDOOR' as const,
    mount: 'FLUSH' as const,
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // File limits
  maxJsonSize: 256 * 1024, // 256KB

  // Security
  security: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:3000'],
    evidenceSecret: process.env.EVIDENCE_SECRET,
    adminApiKey: process.env.ADMIN_API_KEY,
  },

  // Rate Limiting (refined)
  rateLimitRefined: {
    estimateCreate: parseInt(process.env.RATE_LIMIT_ESTIMATE_CREATE || '30'),
    estimateValidate: parseInt(process.env.RATE_LIMIT_ESTIMATE_VALIDATE || '60'),
    default: parseInt(process.env.RATE_LIMIT_DEFAULT || '60'),
  },

  // Idempotency
  idempotency: {
    enabled: true,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Audit
  audit: {
    enabled: process.env.AUDIT_ENABLED !== 'false',
    logRequests: process.env.AUDIT_LOG_REQUESTS !== 'false',
  },
} as const;

export type Config = typeof config;
