# KIS ERP 프로젝트 마스터 플랜

## 📌 프로젝트 개요
- **프로젝트명**: KIS 통합 견적/ERP 시스템
- **목표**: AI 기반 자동 견적 생성 + ERP 통합 시스템
- **핵심**: 채팅으로 모든 업무 처리

## 🏗️ 전체 시스템 아키텍처

### 3-Tier Architecture
```
┌─────────────────────────────────────────────────┐
│              Frontend (React + TypeScript)       │
│  ┌──────────────────────────────────────────┐   │
│  │ 1.AI매니저 │ 2.견적서 │ 3.매출/매입 │ 4.이메일 │   │
│  │ 5.재고 │ 6.거래처 │ 7.직원 │ 8.설정        │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────┐
│           Backend (Node.js + Express)            │
│  ┌──────────────────────────────────────────┐   │
│  │ • REST API Server                        │   │
│  │ • WebSocket Server (실시간 채팅)          │   │
│  │ • File Processing Service                │   │
│  │ • AI Orchestration Layer                 │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────┐
│              Data & AI Layer                     │
│  ┌──────────────────────────────────────────┐   │
│  │ • MongoDB (메인 DB)                       │   │
│  │ • SQLite (로컬 캐시)                      │   │
│  │ • Redis (세션/캐시)                       │   │
│  │ • Existing Estimate AI (handoff)         │   │
│  │ • Multi-AI APIs (OpenAI, Claude, Gemini) │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 💾 데이터베이스 스키마

### MongoDB Collections

#### 1. users (사용자)
```javascript
{
  _id: ObjectId,
  username: String,
  password: String (hashed),
  role: ['admin', 'manager', 'employee'],
  name: String,
  email: String,
  phone: String,
  department: String,
  permissions: [String],
  createdAt: Date,
  lastLogin: Date
}
```

#### 2. estimates (견적서)
```javascript
{
  _id: ObjectId,
  estimateNo: String,        // EST-2025-000001
  customerId: ObjectId,
  projectName: String,
  items: [{
    category: String,         // 외함, 차단기, 부스바, 잡자재
    name: String,
    specification: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  subtotal: Number,
  tax: Number,
  total: Number,
  status: ['draft', 'sent', 'approved', 'rejected'],
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
  aiGenerated: Boolean,
  sourceFiles: [String]       // 업로드된 파일 경로
}
```

#### 3. customers (거래처)
```javascript
{
  _id: ObjectId,
  companyName: String,
  businessNo: String,         // 사업자등록번호
  representative: String,      // 대표자
  address: String,
  phone: String,
  fax: String,
  email: String,
  businessType: String,        // 업종
  notes: String,
  transactions: [{
    date: Date,
    type: ['estimate', 'order', 'invoice'],
    amount: Number,
    documentId: ObjectId
  }],
  isActive: Boolean,
  createdAt: Date
}
```

#### 4. inventory (재고)
```javascript
{
  _id: ObjectId,
  category: String,           // 외함, 차단기, 부스바, 잡자재
  itemCode: String,           // HDS-60-70-15
  itemName: String,
  specification: String,
  unit: String,               // EA, SET, M
  currentStock: Number,
  safetyStock: Number,        // 적정재고
  purchasePrice: Number,      // 매입가
  salePrice: Number,          // 매출가
  wholesalePrice: Number,     // 도매가
  supplier: String,           // 매입처
  location: String,           // 창고 위치
  lastUpdated: Date,
  history: [{
    date: Date,
    type: ['in', 'out'],
    quantity: Number,
    documentNo: String,
    reason: String
  }]
}
```

#### 5. transactions (매출/매입)
```javascript
{
  _id: ObjectId,
  type: ['sales', 'purchase'],
  documentNo: String,
  customerId: ObjectId,
  date: Date,
  items: [{
    itemCode: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  subtotal: Number,
  tax: Number,
  total: Number,
  taxInvoiceNo: String,       // 세금계산서 번호
  status: ['pending', 'completed', 'cancelled'],
  createdBy: ObjectId,
  createdAt: Date
}
```

#### 6. chat_logs (채팅 로그)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  sessionId: String,
  message: {
    role: ['user', 'assistant'],
    content: String,
    files: [String],
    command: String           // 감지된 명령어
  },
  response: {
    type: ['estimate', 'email', 'report', 'answer'],
    data: Object,
    success: Boolean
  },
  timestamp: Date,
  processingTime: Number      // ms
}
```

#### 7. emails (이메일)
```javascript
{
  _id: ObjectId,
  from: String,
  to: [String],
  subject: String,
  body: String,
  attachments: [{
    filename: String,
    path: String,
    size: Number
  }],
  status: ['sent', 'received', 'draft'],
  sentAt: Date,
  receivedAt: Date,
  isRead: Boolean,
  relatedEstimate: ObjectId
}
```

## 🔌 API 엔드포인트 정의

### Authentication
```
POST   /api/auth/login         로그인
POST   /api/auth/logout        로그아웃
POST   /api/auth/refresh       토큰 갱신
GET    /api/auth/me           현재 사용자 정보
```

### AI Manager
```
POST   /api/ai/chat           채팅 메시지 전송
POST   /api/ai/upload         파일 업로드
GET    /api/ai/history        채팅 기록 조회
POST   /api/ai/command        명령어 실행
```

### Estimates
```
GET    /api/estimates         견적서 목록
GET    /api/estimates/:id    견적서 상세
POST   /api/estimates         견적서 생성
PUT    /api/estimates/:id    견적서 수정
DELETE /api/estimates/:id    견적서 삭제
POST   /api/estimates/generate  AI 견적 생성
POST   /api/estimates/:id/send  이메일 발송
```

### Customers
```
GET    /api/customers         거래처 목록
GET    /api/customers/:id    거래처 상세
POST   /api/customers         거래처 등록
PUT    /api/customers/:id    거래처 수정
DELETE /api/customers/:id    거래처 삭제
POST   /api/customers/import  사업자등록증 OCR
```

### Inventory
```
GET    /api/inventory         재고 목록
GET    /api/inventory/:id    재고 상세
POST   /api/inventory         재고 등록
PUT    /api/inventory/:id    재고 수정
POST   /api/inventory/in     입고 처리
POST   /api/inventory/out    출고 처리
GET    /api/inventory/alerts  재고 부족 알림
```

### Transactions
```
GET    /api/transactions      거래 목록
POST   /api/transactions      거래 생성
GET    /api/transactions/report  보고서 생성
POST   /api/transactions/tax-invoice  세금계산서 발행
```

### Emails
```
GET    /api/emails            이메일 목록
GET    /api/emails/:id       이메일 상세
POST   /api/emails/send       이메일 발송
POST   /api/emails/draft      임시 저장
GET    /api/emails/attachments/:id  첨부파일 다운로드
```

### Reports
```
GET    /api/reports/daily     일일 보고서
GET    /api/reports/weekly    주간 보고서
GET    /api/reports/monthly   월간 보고서
GET    /api/reports/custom    맞춤 보고서
```

## 📁 프로젝트 폴더 구조

```
KIS_CORE_V2/
├── frontend/                  # React 프론트엔드
│   ├── src/
│   │   ├── components/       # 재사용 컴포넌트
│   │   │   ├── common/       # 공통 컴포넌트
│   │   │   ├── AIManager/    # AI 매니저 탭
│   │   │   ├── Estimates/    # 견적서 탭
│   │   │   ├── Transactions/ # 매출/매입 탭
│   │   │   ├── Emails/       # 이메일 탭
│   │   │   ├── Inventory/    # 재고 탭
│   │   │   ├── Customers/    # 거래처 탭
│   │   │   ├── Employees/    # 직원 탭
│   │   │   └── Settings/     # 설정 탭
│   │   ├── hooks/            # 커스텀 훅
│   │   ├── services/         # API 서비스
│   │   ├── store/            # 상태 관리 (Zustand)
│   │   ├── utils/            # 유틸리티 함수
│   │   ├── types/            # TypeScript 타입
│   │   ├── styles/           # 글로벌 스타일
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   # Node.js 백엔드
│   ├── src/
│   │   ├── controllers/      # 컨트롤러
│   │   ├── models/           # 데이터 모델
│   │   ├── routes/           # 라우트 정의
│   │   ├── middleware/       # 미들웨어
│   │   ├── services/         # 비즈니스 로직
│   │   │   ├── ai/           # AI 서비스
│   │   │   ├── file/         # 파일 처리
│   │   │   ├── email/        # 이메일 서비스
│   │   │   └── report/       # 보고서 생성
│   │   ├── utils/            # 유틸리티
│   │   ├── config/           # 설정 파일
│   │   ├── app.js            # Express 앱
│   │   └── server.js         # 서버 진입점
│   ├── tests/                # 테스트
│   ├── package.json
│   └── .env.example
│
├── handoff/                   # 기존 견적 AI
│   └── (기존 구조 유지)
│
├── database/                  # DB 관련
│   ├── migrations/
│   ├── seeds/
│   └── backups/
│
├── uploads/                   # 업로드 파일
├── logs/                      # 로그 파일
├── docs/                      # 문서
├── scripts/                   # 유틸리티 스크립트
├── docker-compose.yml         # Docker 설정
├── .gitignore
├── README.md
└── package.json              # 루트 package.json
```

## 🛠️ 기술 스택 최종 결정

### Frontend
- **Framework**: React 18 + TypeScript
- **상태 관리**: Zustand
- **UI 라이브러리**: Material-UI v5
- **차트**: Recharts
- **파일 업로드**: react-dropzone
- **실시간 통신**: Socket.io-client
- **HTTP 클라이언트**: Axios
- **빌드 도구**: Vite

### Backend
- **런타임**: Node.js 18+
- **프레임워크**: Express 5
- **실시간**: Socket.io
- **인증**: JWT + Bcrypt
- **파일 처리**: Multer
- **이메일**: Nodemailer
- **스케줄링**: Node-cron
- **로깅**: Winston
- **검증**: Joi

### Database
- **메인 DB**: MongoDB (Mongoose ODM)
- **캐시**: Redis
- **로컬 DB**: SQLite3

### AI Integration
- **기존 견적 AI**: FastMCP (handoff)
- **OpenAI**: GPT-4o-mini API
- **Claude**: Anthropic API
- **Gemini**: Google AI API
- **OCR**: Tesseract.js
- **PDF**: pdf-parse
- **Excel**: xlsx

### DevOps
- **컨테이너**: Docker
- **프로세스 관리**: PM2
- **리버스 프록시**: Nginx
- **모니터링**: Winston + Custom Dashboard

## 📅 개발 마일스톤

### Phase 1: 기초 설정 (Day 1 - 오전)
- [ ] 프로젝트 구조 생성
- [ ] 기본 의존성 설치
- [ ] MongoDB 연결 설정
- [ ] Express 서버 기본 설정
- [ ] React 프로젝트 초기화

### Phase 2: 핵심 백엔드 (Day 1 - 오후)
- [ ] 데이터 모델 정의
- [ ] 인증 시스템 구현
- [ ] 기본 CRUD API 구현
- [ ] 파일 업로드 시스템
- [ ] WebSocket 설정

### Phase 3: AI 매니저 탭 (Day 2 - 오전)
- [ ] 채팅 인터페이스 구현
- [ ] 파일 드래그앤드롭
- [ ] AI 연동 (기존 견적 AI + OpenAI)
- [ ] 명령어 처리 시스템
- [ ] 결과 표시 패널

### Phase 4: 견적서 탭 (Day 2 - 오후)
- [ ] 견적서 목록/상세 뷰
- [ ] 시스템 견적 팝업
- [ ] 견적서 편집 기능
- [ ] PDF 내보내기
- [ ] 이메일 발송 연동

### Phase 5: ERP 기능 (Day 3 - 오전)
- [ ] 매출/매입 관리
- [ ] 재고 관리
- [ ] 거래처 관리
- [ ] 세금계산서 발행

### Phase 6: 부가 기능 (Day 3 - 오후)
- [ ] 이메일 시스템
- [ ] 직원 관리
- [ ] 설정 페이지
- [ ] 보고서 생성

### Phase 7: 통합 테스트 (Day 4)
- [ ] 전체 시나리오 테스트
- [ ] 성능 최적화
- [ ] 보안 점검
- [ ] 배포 준비

## 🎯 핵심 기능 우선순위

### 필수 (MVP)
1. AI 채팅 인터페이스
2. 견적서 생성/조회
3. 파일 업로드 (Excel, PDF, 이미지)
4. 거래처 관리
5. 기본 재고 관리

### 중요
1. 이메일 연동
2. 세금계산서 발행
3. 보고서 생성
4. OCR 처리

### 선택
1. 직원 관리
2. 고급 통계
3. 다중 언어 지원
4. 모바일 앱

## 🚀 시작 명령어

```bash
# 1. 프로젝트 구조 생성
mkdir -p frontend backend database uploads logs

# 2. Backend 초기화
cd backend
npm init -y
npm install express mongoose cors dotenv bcrypt jsonwebtoken

# 3. Frontend 초기화
cd ../frontend
npm create vite@latest . -- --template react-ts
npm install @mui/material zustand axios socket.io-client

# 4. 개발 서버 실행
npm run dev
```

## ✅ 체크리스트

### 계획 단계 ✓
- [x] 시스템 아키텍처 정의
- [x] 데이터베이스 스키마 설계
- [x] API 엔드포인트 명세
- [x] 폴더 구조 결정
- [x] 기술 스택 확정
- [x] 개발 일정 수립

### 준비 확인
- [ ] MongoDB 설치/접속 확인
- [ ] Redis 설치/실행 확인
- [ ] Node.js 18+ 설치 확인
- [ ] 기존 견적 AI (handoff) 작동 확인
- [ ] OpenAI API 키 준비

## 📝 주의사항

1. **기존 견적 AI 활용**: handoff 폴더의 AI를 최대한 활용
2. **단계별 구현**: 한 번에 모든 기능 X, MVP 먼저
3. **테스트 우선**: 각 기능 완성 즉시 테스트
4. **문서화**: 코드와 동시에 문서 작성
5. **버전 관리**: Git 커밋 자주

---

이제 완벽한 계획이 준비되었습니다. 시작할 준비가 되셨나요?