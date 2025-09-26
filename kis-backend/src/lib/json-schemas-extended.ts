// ============================================
// Extended JSON Schemas for ABSTAIN/OK responses
// ============================================

import { EstimateResponseJSONSchema } from './json-schemas.js';

// ABSTAIN 응답용 스키마
export const EstimateAbstainResponseJSONSchema = {
  type: 'object',
  required: ['decision', 'reasons', 'hints', 'metadata'],
  properties: {
    decision: { type: 'string', enum: ['ABSTAIN'] },
    reasons: {
      type: 'array',
      items: { type: 'string' }
    },
    hints: {
      type: 'array',
      items: { type: 'string' }
    },
    metadata: {
      type: 'object',
      required: ['stage', 'status', 'requestId'],
      properties: {
        stage: { type: 'string' },
        status: { type: 'string' },
        requestId: { type: 'string' }
      }
    }
  }
};

// OK 응답용 스키마
export const EstimateOkResponseJSONSchema = {
  type: 'object',
  required: ['decision', 'estimate'],
  properties: {
    decision: { type: 'string', enum: ['OK'] },
    estimate: EstimateResponseJSONSchema
  }
};

// 통합 API 응답 스키마 (Union)
export const EstimateApiResponseJSONSchema = {
  oneOf: [
    EstimateAbstainResponseJSONSchema,
    EstimateOkResponseJSONSchema
  ]
};