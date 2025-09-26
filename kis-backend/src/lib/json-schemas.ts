// ============================================
// JSON Schemas for Fastify Validation
// ============================================

export const EstimateRequestJSONSchema = {
  type: 'object',
  required: ['brand', 'form', 'installation', 'device', 'main', 'branches', 'accessories'],
  properties: {
    brand: {
      type: 'string',
      enum: ['SANGDO', 'LS', 'MIXED']
    },
    form: {
      type: 'string',
      enum: ['ECONOMIC', 'STANDARD']
    },
    installation: {
      type: 'object',
      required: ['location', 'mount'],
      properties: {
        location: { type: 'string', enum: ['INDOOR', 'OUTDOOR'] },
        mount: { type: 'string', enum: ['FLUSH', 'SURFACE'] }
      }
    },
    device: {
      type: 'object',
      required: ['type'],
      properties: {
        type: { type: 'string' },
        purpose: { type: 'string' },
        feeder: { type: 'string' },
        gates: { type: 'number', minimum: 1 }
      }
    },
    main: {
      type: 'object',
      required: ['enabled'],
      properties: {
        enabled: { type: 'boolean' },
        AF: { type: 'number' },
        AT: { type: 'number' },
        af: { type: 'number' },
        at: { type: 'number' },
        poles: {
          anyOf: [
            { type: 'string', enum: ['2P', '3P', '4P'] }, // Standard contract
            { type: 'number', enum: [2, 3, 4] }           // Temporary compatibility
          ]
        },
        model: { type: 'string' }
      }
    },
    branches: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['poles', 'qty'],
        properties: {
          AF: { type: 'number' },
          AT: { type: 'number' },
          af: { type: 'number' },
          at: { type: 'number' },
          poles: {
          anyOf: [
            { type: 'string', enum: ['2P', '3P', '4P'] }, // Standard contract
            { type: 'number', enum: [2, 3, 4] }           // Temporary compatibility
          ]
        },
          qty: { type: 'number', minimum: 1 },
          model: { type: 'string' },
          remark: { type: 'string' }
        }
      }
    },
    accessories: {
      type: 'object',
      required: ['enabled'],
      properties: {
        enabled: { type: 'boolean' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'count'],
            properties: {
              name: { type: 'string' },
              count: { type: 'number', minimum: 1 }
            }
          }
        }
      }
    }
  }
};

export const EstimateResponseJSONSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    request: EstimateRequestJSONSchema,
    result: {
      type: 'object',
      properties: {
        W: { type: 'number' },
        H: { type: 'number' },
        D: { type: 'number' },
        form: { type: 'string', enum: ['ECONOMIC', 'STANDARD'] },
        layout: {
          type: 'object',
          properties: {
            rows: { type: 'number' },
            maxWidthPerRow: { type: 'number' },
            totalItems: { type: 'number' }
          }
        }
      }
    },
    evidenceId: { type: 'string' },
    status: { type: 'string', enum: ['draft', 'validated', 'completed', 'failed'] },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' }
  }
};

export const CalendarEventJSONSchema = {
  type: 'object',
  required: ['title', 'date', 'type'],
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    date: { type: 'string', format: 'date-time' },
    type: {
      type: 'string',
      enum: ['ESTIMATE', 'DELIVERY', 'MEETING', 'PAYMENT', 'OTHER']
    },
    estimateId: { type: 'string' },
    participantEmails: {
      type: 'array',
      items: { type: 'string', format: 'email' }
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const CalendarEventCreateJSONSchema = {
  type: 'object',
  required: ['title', 'date', 'type'],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    date: { type: 'string', format: 'date-time' },
    type: {
      type: 'string',
      enum: ['ESTIMATE', 'DELIVERY', 'MEETING', 'PAYMENT', 'OTHER']
    },
    estimateId: { type: 'string' },
    participantEmails: {
      type: 'array',
      items: { type: 'string', format: 'email' }
    }
  }
};

export const CalendarEventUpdateJSONSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    date: { type: 'string', format: 'date-time' },
    type: {
      type: 'string',
      enum: ['ESTIMATE', 'DELIVERY', 'MEETING', 'PAYMENT', 'OTHER']
    },
    participantEmails: {
      type: 'array',
      items: { type: 'string', format: 'email' }
    }
  }
};

export const EmailGroupJSONSchema = {
  type: 'object',
  required: ['name', 'recipients'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    recipients: {
      type: 'array',
      items: { type: 'string', format: 'email' }
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const EmailGroupCreateJSONSchema = {
  type: 'object',
  required: ['name', 'recipients'],
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    recipients: {
      type: 'array',
      minItems: 1,
      items: { type: 'string', format: 'email' }
    }
  }
};

export const EmailGroupUpdateJSONSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    recipients: {
      type: 'array',
      minItems: 1,
      items: { type: 'string', format: 'email' }
    }
  }
};

export const EmailThreadJSONSchema = {
  type: 'object',
  required: ['subject', 'content', 'groupId'],
  properties: {
    id: { type: 'string' },
    subject: { type: 'string' },
    content: { type: 'string' },
    groupId: { type: 'string' },
    status: {
      type: 'string',
      enum: ['SENT', 'FAILED', 'DRAFT']
    },
    sentAt: { type: 'string', format: 'date-time' },
    estimateId: { type: 'string' },
    attachments: {
      type: 'array',
      items: { type: 'string' }
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const EmailThreadCreateJSONSchema = {
  type: 'object',
  required: ['subject', 'content', 'groupId'],
  properties: {
    subject: { type: 'string' },
    content: { type: 'string' },
    groupId: { type: 'string' },
    estimateId: { type: 'string' },
    attachments: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

export const EmailThreadUpdateJSONSchema = {
  type: 'object',
  properties: {
    subject: { type: 'string' },
    content: { type: 'string' },
    status: {
      type: 'string',
      enum: ['SENT', 'FAILED', 'DRAFT']
    },
    attachments: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

export const DrawingJSONSchema = {
  type: 'object',
  required: ['name', 'rev', 'author'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    rev: { type: 'string' },
    author: { type: 'string' },
    description: { type: 'string' },
    content: { type: 'string' },
    tags: {
      type: 'array',
      items: { type: 'string' }
    },
    metadata: { type: 'object' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const DrawingCreateJSONSchema = {
  type: 'object',
  required: ['name', 'rev', 'author'],
  properties: {
    name: { type: 'string' },
    rev: { type: 'string' },
    author: { type: 'string' },
    description: { type: 'string' },
    content: { type: 'string' },
    tags: {
      type: 'array',
      items: { type: 'string' }
    },
    metadata: { type: 'object' }
  }
};

export const DrawingUpdateJSONSchema = {
  type: 'object',
  properties: {
    author: { type: 'string' },
    description: { type: 'string' },
    content: { type: 'string' },
    tags: {
      type: 'array',
      items: { type: 'string' }
    },
    metadata: { type: 'object' }
  }
};

export const SettingsJSONSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    singleBrand: { type: 'boolean' },
    antiPoleMistake: { type: 'boolean' },
    allowMixedBrand: { type: 'boolean' },
    require3Gates: { type: 'boolean' },
    defaultBrand: {
      type: 'string',
      enum: ['SANGDO', 'LS', 'MIXED']
    },
    defaultForm: {
      type: 'string',
      enum: ['ECONOMIC', 'STANDARD']
    },
    defaultLocation: {
      type: 'string',
      enum: ['INDOOR', 'OUTDOOR']
    },
    defaultMount: {
      type: 'string',
      enum: ['FLUSH', 'SURFACE']
    },
    economicByDefault: { type: 'boolean' },
    knowledgeVersion: {
      type: 'object',
      properties: {
        rules: { type: 'string' },
        tables: { type: 'string' }
      }
    }
  }
};

export const SettingsUpdateJSONSchema = {
  type: 'object',
  properties: {
    singleBrand: { type: 'boolean' },
    antiPoleMistake: { type: 'boolean' },
    allowMixedBrand: { type: 'boolean' },
    require3Gates: { type: 'boolean' },
    defaultBrand: {
      type: 'string',
      enum: ['SANGDO', 'LS', 'MIXED']
    },
    defaultForm: {
      type: 'string',
      enum: ['ECONOMIC', 'STANDARD']
    },
    defaultLocation: {
      type: 'string',
      enum: ['INDOOR', 'OUTDOOR']
    },
    defaultMount: {
      type: 'string',
      enum: ['FLUSH', 'SURFACE']
    },
    economicByDefault: { type: 'boolean' },
    knowledgeVersion: {
      type: 'object',
      properties: {
        rules: { type: 'string' },
        tables: { type: 'string' }
      }
    }
  }
};
