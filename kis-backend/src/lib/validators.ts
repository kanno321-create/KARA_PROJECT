import { z } from 'zod';

// ============================================
// 기본 열거형 (Enums)
// ============================================

export const BrandSchema = z.enum(['SANGDO', 'LS', 'MIXED']);
export const FormSchema = z.enum(['ECONOMIC', 'STANDARD']);
export const LocationSchema = z.enum(['INDOOR', 'OUTDOOR']);
export const MountSchema = z.enum(['FLUSH', 'SURFACE']);
export const DeviceTypeSchema = z.enum(['MCCB', 'ELCB']);
export const PolesSchema = z.enum(['2P', '3P', '4P']);

export type Brand = z.infer<typeof BrandSchema>;
export type Form = z.infer<typeof FormSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Mount = z.infer<typeof MountSchema>;
export type DeviceType = z.infer<typeof DeviceTypeSchema>;
export type Poles = z.infer<typeof PolesSchema>;

// ============================================
// 견적 요청/응답 스키마
// ============================================

export const InstallationSchema = z.object({
  location: LocationSchema,
  mount: MountSchema,
});

export const DeviceSchema = z.object({
  type: DeviceTypeSchema,
});

export const MainBreakerSchema = z.object({
  model: z.string().optional(),
  af: z.number().optional(),
  poles: PolesSchema,
}).refine(
  (data) => data.model || data.af,
  { message: "model 또는 af 중 하나는 필수입니다", path: ['model'] }
);

export const BranchBreakerSchema = z.object({
  model: z.string().optional(),
  af: z.number().optional(),
  poles: PolesSchema,
  qty: z.number().min(1),
}).refine(
  (data) => data.model || data.af,
  { message: "model 또는 af 중 하나는 필수입니다", path: ['model'] }
);

export const AccessoryItemSchema = z.object({
  name: z.string(),
  model: z.string().optional(),
  qty: z.number().min(1),
  dimensions: z.object({
    width_mm: z.number(),
    height_mm: z.number(),
    depth_mm: z.number(),
  }).optional(),
});

export const AccessoriesSchema = z.object({
  enabled: z.boolean(),
  items: z.array(AccessoryItemSchema).optional(),
}).refine(
  (data) => !data.enabled || (data.items && data.items.length > 0),
  { message: "enabled=true일 때는 items가 필요합니다", path: ['items'] }
).refine(
  (data) => data.enabled || !data.items || data.items.length === 0,
  { message: "enabled=false일 때는 items를 비워주세요", path: ['items'] }
);

export const EstimateRequestSchema = z.object({
  brand: BrandSchema,
  form: FormSchema,
  installation: InstallationSchema,
  device: DeviceSchema,
  main: MainBreakerSchema,
  branches: z.array(BranchBreakerSchema).min(1),
  accessories: AccessoriesSchema,
});

export const EnclosureResultSchema = z.object({
  W: z.number(),
  H: z.number(),
  D: z.number(),
  form: FormSchema,
  layout: z.object({
    rows: z.number(),
    maxWidthPerRow: z.number(),
    totalItems: z.number(),
  }),
});

export const EstimateResponseSchema = z.object({
  id: z.string(),
  brand: BrandSchema,
  form: FormSchema,
  installation: InstallationSchema,
  device: DeviceSchema,
  main: MainBreakerSchema,
  branches: z.array(BranchBreakerSchema),
  accessories: AccessoriesSchema,
  enclosure: EnclosureResultSchema.optional(),
  status: z.enum(['draft', 'validated', 'completed', 'failed']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const EstimateAbstainResponseSchema = z.object({
  decision: z.literal('ABSTAIN'),
  reasons: z.array(z.string()),
  hints: z.array(z.string()),
  metadata: z.object({
    stage: z.string(),
    status: z.string(),
    requestId: z.string(),
  }),
});

export const EstimateOkResponseSchema = z.object({
  decision: z.literal('OK'),
  estimate: EstimateResponseSchema,
});

// 유니온 타입으로 정의
export const EstimateApiResponseSchema = z.union([
  EstimateAbstainResponseSchema,
  EstimateOkResponseSchema,
]);

export type EstimateRequest = z.infer<typeof EstimateRequestSchema>;
export type EstimateResponse = z.infer<typeof EstimateResponseSchema>;
export type EstimateAbstainResponse = z.infer<typeof EstimateAbstainResponseSchema>;
export type EstimateApiResponse = z.infer<typeof EstimateApiResponseSchema>;
export type EnclosureResult = z.infer<typeof EnclosureResultSchema>;

// ============================================
// 증거 패키지 스키마
// ============================================

export const EvidenceTableRowSchema = z.object({
  source: z.string(),
  rows: z.array(z.string()),
});

export const EvidenceSchema = z.object({
  id: z.string(),
  estimateId: z.string(),
  rulesDoc: z.string(),
  tables: z.array(EvidenceTableRowSchema),
  brandPolicy: z.string(),
  snapshot: z.record(z.string(), z.any()),
  snapshotHash: z.string(),
  rulesVersion: z.string(),
  knowledgeVersion: z.string(),
  usedRows: z.array(z.string()),
  tableHashes: z.record(z.string(), z.string()),
  signature: z.string(),
  version: z.object({
    rules: z.string(),
    tables: z.string(),
  }),
  createdAt: z.string(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

// ============================================
// ABSTAIN 스키마
// ============================================

export const AbstainSchema = z.object({
  id: z.string(),
  estimateId: z.string().optional(),
  requestPath: z.string(),
  missingData: z.string(),
  suggestion: z.string(),
  status: z.enum(['pending', 'resolved', 'ignored']),
  resolution: z.object({
    providedData: z.record(z.string(), z.any()),
    updatedVersion: z.string(),
  }).optional(),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
});

export type Abstain = z.infer<typeof AbstainSchema>;

// ============================================
// 캘린더 스키마
// ============================================

export const CalendarEventSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['estimate', 'install', 'inbound', 'misc']),
  title: z.string(),
  start: z.string(), // ISO date string
  end: z.string(),   // ISO date string
  location: z.string().optional(),
  memo: z.string().optional(),
  owner: z.string().optional(),
  links: z.object({
    estimates: z.array(z.string()).optional(),
    drawings: z.array(z.string()).optional(),
    emails: z.array(z.string()).optional(),
  }).optional(),
  conflicts: z.array(z.object({
    eventId: z.string(),
    title: z.string(),
  })).optional(),
});

export const CalendarCreateSchema = CalendarEventSchema.omit({ id: true });
export const CalendarUpdateSchema = CalendarEventSchema.partial();

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type CalendarCreate = z.infer<typeof CalendarCreateSchema>;
export type CalendarUpdate = z.infer<typeof CalendarUpdateSchema>;

// ============================================
// 이메일 스키마
// ============================================

export const EmailRuleSchema = z.object({
  type: z.enum(['email', 'domain']),
  value: z.string(),
});

export const EmailGroupSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  rules: z.array(EmailRuleSchema),
});

export const EmailGroupCreateSchema = EmailGroupSchema.omit({ id: true });
export const EmailGroupUpdateSchema = EmailGroupSchema.partial().omit({ id: true });

export const EmailAttachmentSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  link: z.string(),
});

export const EmailThreadSchema = z.object({
  id: z.string().optional(),
  to: z.string().optional(),
  cc: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().default(''),
  status: z.enum(['SENT', 'FAILED', 'DRAFT']).default('DRAFT'),
  attachments: z.array(EmailAttachmentSchema).optional(),
  groupId: z.string().optional(),
});

export const EmailThreadCreateSchema = EmailThreadSchema.omit({ id: true });
export const EmailThreadUpdateSchema = EmailThreadSchema.partial().omit({ id: true });

export type EmailGroup = z.infer<typeof EmailGroupSchema>;
export type EmailGroupCreate = z.infer<typeof EmailGroupCreateSchema>;
export type EmailGroupUpdate = z.infer<typeof EmailGroupUpdateSchema>;
export type EmailThread = z.infer<typeof EmailThreadSchema>;
export type EmailThreadCreate = z.infer<typeof EmailThreadCreateSchema>;
export type EmailThreadUpdate = z.infer<typeof EmailThreadUpdateSchema>;

// ============================================
// 도면 스키마
// ============================================

export const DrawingHistoryEntrySchema = z.object({
  ts: z.string(), // timestamp
  action: z.string(),
  note: z.string().optional(),
});

export const DrawingSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  rev: z.string(),
  date: z.string().optional(), // ISO date string
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  memo: z.string().optional(),
  history: z.array(DrawingHistoryEntrySchema).optional(),
  links: z.object({
    estimates: z.array(z.string()).optional(),
    events: z.array(z.string()).optional(),
  }).optional(),
});

export const DrawingCreateSchema = DrawingSchema.omit({ id: true });
export const DrawingUpdateSchema = DrawingSchema.partial().omit({ id: true, name: true, rev: true });

export type Drawing = z.infer<typeof DrawingSchema>;
export type DrawingCreate = z.infer<typeof DrawingCreateSchema>;
export type DrawingUpdate = z.infer<typeof DrawingUpdateSchema>;

// ============================================
// 설정 스키마
// ============================================

export const SettingsRulesSchema = z.object({
  singleBrand: z.boolean().default(true),
  antiPoleMistake: z.boolean().default(true),
  allowMixedBrand: z.boolean().default(false),
  require3Gates: z.boolean().default(true),
  economicByDefault: z.boolean().default(true),
});

export const SettingsKnowledgeVersionSchema = z.object({
  rules: z.string(),
  tables: z.string(),
  updated: z.string(), // ISO date string
});

export const SettingsSchema = z.object({
  id: z.string().optional(),
  defaultBrand: BrandSchema.default('SANGDO'),
  defaultForm: FormSchema.default('ECONOMIC'),
  defaultLocation: LocationSchema.default('INDOOR'),
  defaultMount: MountSchema.default('FLUSH'),
  rules: SettingsRulesSchema,
  knowledgeVersion: SettingsKnowledgeVersionSchema,
});

export const SettingsUpdateSchema = SettingsSchema.partial().omit({ id: true });

export type Settings = z.infer<typeof SettingsSchema>;
export type SettingsUpdate = z.infer<typeof SettingsUpdateSchema>;

// ============================================
// 공통 응답 스키마
// ============================================

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  total: z.number(),
  totalPages: z.number(),
});

export const SuccessResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  path: z.string().optional(),
  hint: z.string().optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================
// 감사 로그 스키마
// ============================================

export const AuditLogSchema = z.object({
  id: z.string(),
  actor: z.string(),
  action: z.string(),
  payload: z.record(z.string(), z.any()),
  result: z.enum(['success', 'failed', 'abstain']).optional(),
  createdAt: z.string(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;