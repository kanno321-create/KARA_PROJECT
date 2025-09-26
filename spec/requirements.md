# KIS Frontend -> Backend Requirements Map
 > Contract Source of Truth
 > - Frontend entry: frontend-kis-complete.html
 > - Backend contract: spec/openapi.yaml
 > - Timestamp policy: All API timestamps are serialized as ISO8601 with a trailing Z (UTC).
 > - Conflict handling: dedupKey collisions return 409 DUPLICATE_KEY with meta.dedupKey.
 > - Last synced: 2025-09-26T03:00:00Z
## Source
- Entry HTML: `frontend-kis-complete.html`
- Script scope: single inline `<script>` block (~31kB) with UI state & handlers; no external JS beyond Lucide icons.

## 1. UI Modules & Working State
| Module | Key Elements | Client State Shape | Notes for Backend |
| --- | --- | --- | --- |
| **AI Hero & Chat (AI manager home)** | `#heroInput`, `#heroSendBtn`, `#chatInput`, `#chatSendBtn`, `.prompt-chip` chips | `messages: [{id, type: 'user'|'ai', content, timestamp}]`, `currentView` | Currently generates canned responses via `generateAIResponse`. Needs conversational API with streaming or chunked replies, request tracing, and prompt chip metadata. |
| **Quote Workspace** | Tab strip `#quoteTabs`, form inputs (`companyName`, `contact`, `email`, `address`, etc.), list containers (`#branchList`, `#accessoryList`) | `tabs: [{ id, title, customerInfo, enclosureInfo, mainBreakerInfo, branchBreakers[], accessories[], estimateVisible }]`; also working copies `customerInfo`, `enclosureInfo`, `mainBreakerInfo`, `branchBreakers`, `accessories`, `estimateVisible` | UI manages multiple in-memory quote drafts. Backend must persist per-tab quote sessions and return canonical IDs so tabs can be loaded lazily. |
| **Breaker Settings Popup** | `#breakerSettingsPopup`, selectors for brands | `breakerSettings: { mainBrand, branchBrand, accessoryBrand }` (currently implicit) | Save currently shows alert only. Needs read/write endpoints with RBAC (only KIS_ADMIN may change). |
| **Estimate Result Pane** | `#generateEstimateBtn`, `#estimateTable`, `#totalAmount`, export buttons | Derived totals calculated from local arrays (fixed unit costs) | Replace with server-evaluated pricing, cost breakdown, tax, latency metadata, dedup key, evidence bundle link. |
| **AI File Intake** | `#aiFileInput`, `#aiFileArea`, `#aiFileList`, `analyzeFiles()` | `aiFiles: File[]`, `aiMessages[]` | Front expects upload + auto-fill + AI narration. Needs async upload, analysis status polling, automatic population payload, evidence attachments. |
| **Nav Shell & Misc** | Sidebar nav `.sidebar-nav-item`, `toggleSidebar()` | `currentView`, `sidebarCollapsed` | Navigation toggles between sections (AI manager, estimate, ERP placeholder, etc.). Backend not directly called but should expose health/notifications for future badges. |

## 2. Event -> Backend Interaction Map

### 2.1 AI Hero & Chat Flows
| UI Trigger | Current Behavior | Required Backend Contract |
| --- | --- | --- |
| Hero send (`#heroSendBtn` click / Enter) | Switches to chat, pushes message, calls `addMessage('user')` only. | `POST /v1/ai/chat/messages` with `{channel: 'hero', sessionId?, message}`; response should stream or return `{reply, evidenceRefs, actions, traceId, latencyMs}`. |
| Chat send (`#chatSendBtn` / Enter) | Adds user message; `generateAIResponse` returns canned reply. | Same as above but `channel: 'chat'`. Should support `nextActions`, `planTree`, `riskBadge` per policy-first ChatOps idea. |
| Prompt chip click | Prefills hero input and triggers send. | Chips should be backed by server-provided `suggestedPrompts`. Proposed `GET /v1/ai/chat/prompts?persona=estimator` to hydrate chips (cacheable). |
| AI popup send (`#aiSendBtn`) | Adds message and returns canned response after timeout. | `POST /v1/ai/manager/messages` with capability toggles for evidence drawer and dual approval; response should include `queueUpdate`, `riskNote?`. |
| File analyze (`analyzeFiles`) | Appends message, runs `fillFormAutomatically()` after 3s. | `POST /v1/ai/manager/uploads` (multipart) -> returns `analysisId`. Follow with `GET /v1/ai/manager/uploads/{analysisId}` for status, `autoFillPayload` for `customerInfo`, `enclosureInfo`, breakers, branch suggestions, accessory suggestions, risk flags. |

### 2.2 Quote Workspace Flows
| UI Trigger | Form Data | Backend API Need |
| --- | --- | --- |
| Tab creation (`#addTabBtn`) | Creates local tab template. | `POST /v1/quotes` -> `{id, title, draftState}`; on load call `GET /v1/quotes?status=draft` to hydrate tabs. |
| Tab switch (`switchTab`) | Copies state into working vars. | `GET /v1/quotes/{id}` should return latest persisted state incl. history snapshots. |
| Customer/contact inputs (`input` events) | Update local `customerInfo`. | Debounced `PATCH /v1/quotes/{id}` to persist `customerInfo`; response echoes canonical state, `updatedAt`, `auditId`. |
| Enclosure/main breaker toggles (`.toggle-option`, `.oval-toggle`, selects) | Build `enclosureInfo`, `mainBreakerInfo`. | Need reference data endpoints: `GET /v1/catalog/enclosures`, `GET /v1/catalog/breakers?type=MCCB`, etc., returning brands, capacities, unit costs, allowable combinations. |
| Branch breaker add (`#addBranchBtn`) | Adds `{type, poles, capacity, quantity}` to array. | `POST /v1/quotes/{id}/branch-breakers` returning normalized entry with pricing, lead time, compliance tags. Dedup (same config) should increment quantity server-side. |
| Accessory add / magnet add | Adds accessory descriptor. | `POST /v1/quotes/{id}/accessories` with category/detail/spec/magnet options. Response includes recommended price, vendor, compliance. |
| Generate estimate (`#generateEstimateBtn`) | Calls `generateEstimate()` -> calculates table locally. | Must call `POST /v1/estimate` with entire quote snapshot. Response: `{quoteId, items[], totals, taxes, pricingModel, evidenceBundleId, meta: {latencyMs, dedupKey, riskScore}}`. Should also set `estimateVisible` true. |
| Export buttons (PDF/Excel) | Currently no handler. | Provide `GET /v1/quotes/{id}/export?format=pdf|xlsx` returning file + evidence hash. |
| "Send quote" button | No handler yet. | `POST /v1/quotes/{id}/dispatch` with channel/email template; response includes MJML email preview, audit log entry. |

### 2.3 Breaker Settings & RBAC
| UI Trigger | Required Behavior | Contract |
| --- | --- | --- |
| Open popup (`#breakerSettingsBtn`) | Should fetch current settings. | `GET /v1/settings/breakers` (RBAC guarded). |
| Save (`#saveBreakerSettings`) | Alert only. | `PUT /v1/settings/breakers` accepting `{mainBrand, branchBrand, accessoryBrand}`. Only `role=KIS_ADMIN` allowed; others receive 403 with standard error envelope containing `traceId`. Must emit audit trail entry. |

### 2.4 Evidence & Governance Features ("12 ideas")
Each idea implies supporting endpoints & data contracts:
- **Policy-first ChatOps compiler**: `POST /v1/policy/plan-tree` producing DAG + risk badge, `POST /v1/policy/agreements` to lock approved plans.
- **Evidence drawer**: `GET /v1/evidence/{bundleId}` returns metadata + assets (SVG heatmap, JSON logs, etc.).
- **Drag-and-drop multi-file ingestion**: `POST /v1/ai/manager/uploads` (see above) plus `POST /v1/knowledge/packs` to persist approved knowledge packs.
- **Mail-to-chat bridge**: `POST /v1/integrations/mail/import` to spawn AI session + `POST /v1/integrations/mail/draft` for MJML output.
- **Estimate time-travel & replay**: `GET /v1/quotes/{id}/revisions`, `POST /v1/quotes/{id}/replay` to rerun pipelines and produce change-impact report.
- **Agentic queue board**: `GET /v1/agent-queue` providing cards (`inbox/ready/doing/verify/reflect/done`, with gate scores & cost toggles), `PATCH /v1/agent-queue/{id}` for transitions with guardrails.
- **Predictive ERP handoff**: Provide forecast-only endpoint `POST /v1/estimates/{id}/forecast` returning demand/delivery suggestions while keeping actual ERP integration disabled (per ERP boundary).
- **Design-as-evidence**: `POST /v1/evidence/design-snapshots` for document lint metrics, referenced by evidence drawer.
- **Dual approval with risk notes**: `POST /v1/approvals/requests` returning required approver list & risk note skeleton; `POST /v1/approvals/{id}/decisions`.
- **Knowledge pack enforcement**: `GET /v1/knowledge/packs`, `PUT /v1/knowledge/packs/{id}` (KIS_ADMIN only), ensure each AI answer references pack `rule/refutation/test/hash` tuple.
- **Dedup / latency guard**: All mutating endpoints accept optional `dedupKey`; duplicates return 409 with canonical payload & `meta.latencyMs` in success responses.
- **Desktop commander guard**: `GET /v1/file-guard/whitelist` & `POST /v1/file-guard/audit` (logs). No filesystem escape endpoints allowed.

### 2.5 Catalog Data Hydration
- `GET /v1/catalog/accessories` -> returns categories, details, specs (currently hard-coded in frontend).
- `GET /v1/catalog/magnets` -> available models, valid timer/PBL combinations.
- `GET /v1/catalog/materials` -> enclosure material list & base pricing.

## 3. Storage, Tokens, Headers
- No usage of `localStorage`/`sessionStorage` observed; current script stores everything in-memory.
- To integrate RBAC: frontend must persist JWT (e.g., `Authorization: Bearer <token>`) retrieved via future login flow. Until implemented, plan for in-memory token injection; document header requirements: `Authorization`, `X-Request-ID`, optional `X-Dedup-Key`, `X-Client-Version`.
- File uploads require multipart with `Content-Type: multipart/form-data`; expect backend to return `analysisId`, `requestId`, and signed URLs for evidence artifacts.

## 4. Error & Logging Expectations
- Present UI uses `alert()` for validation errors; backend responses should follow `{error: {code, message, traceId}}` schema so frontend can surface consistent toasts.
- Latency targets: include `meta.latencyMs` in all successful responses to satisfy dedup/latency guard UX.
- Provide `traceId` header echo (`X-Trace-Id`) for correlation with structured JSON logs.

## 5. Outstanding Gaps
- No existing network calls; all above endpoints must be wired via future adapter without altering current DOM/events.
- ERP navigation has no content; per scope, backend must not expose ERP data, only placeholder health status if needed.
- Need bridging script (`kis-adapter.js`) in future sprint to replace local calculations with API calls while preserving UI behavior.


