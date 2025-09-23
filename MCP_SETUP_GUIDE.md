# MCP 서버 설정 가이드

## Claude Desktop MCP 서버 설정 방법

MCP (Model Context Protocol) 서버는 Claude Desktop 앱의 설정 파일을 통해 구성됩니다.

### 설정 파일 위치
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

### 설정 파일 예시

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\PC\\Desktop\\KIS_CORE_V2"]
    },
    "postgresql": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgresql", "postgresql://user:password@localhost/dbname"]
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "path/to/database.db"]
    },
    "mongodb": {
      "command": "npx",
      "args": ["-y", "mcp-server-mongodb", "mongodb://localhost:27017/kis_erp"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "smtp": {
      "command": "npx",
      "args": ["-y", "mcp-server-smtp"],
      "env": {
        "SMTP_HOST": "smtp.gmail.com",
        "SMTP_PORT": "587",
        "SMTP_USER": "your-email@gmail.com",
        "SMTP_PASS": "your-app-password"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-token",
        "SLACK_TEAM_ID": "your-team-id"
      }
    },
    "google-drive": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-drive"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "path/to/credentials.json"
      }
    },
    "google-sheets": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-sheets"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "path/to/credentials.json"
      }
    },
    "openai": {
      "command": "npx",
      "args": ["-y", "@angheljf/mcp-server-openai"],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key"
      }
    },
    "pdf": {
      "command": "npx",
      "args": ["-y", "mcp-server-pdf"]
    },
    "ocr": {
      "command": "npx",
      "args": ["-y", "mcp-server-ocr"]
    },
    "excel": {
      "command": "npx",
      "args": ["-y", "mcp-server-excel"]
    },
    "webhook": {
      "command": "npx",
      "args": ["-y", "mcp-server-webhook"]
    },
    "scheduler": {
      "command": "npx",
      "args": ["-y", "mcp-server-scheduler"]
    },
    "sms": {
      "command": "npx",
      "args": ["-y", "mcp-server-sms"],
      "env": {
        "SMS_API_KEY": "your-sms-api-key",
        "SMS_SENDER": "your-sender-id"
      }
    }
  }
}
```

## 프로젝트에 설치된 npm 패키지

### 데이터베이스
- `mongodb`: MongoDB 드라이버
- `mongoose`: MongoDB ODM
- `sqlite3`: SQLite 데이터베이스
- `postgresql`: PostgreSQL 클라이언트

### 서버 및 API
- `express`: 웹 서버 프레임워크
- `cors`: CORS 미들웨어
- `body-parser`: 요청 본문 파싱
- `axios`: HTTP 클라이언트
- `socket.io`: 실시간 통신

### AI 및 API 통합
- `openai`: OpenAI API 클라이언트

### 이메일
- `nodemailer`: 이메일 발송
- `@sendgrid/mail`: SendGrid 이메일 서비스

### 문서 처리
- `pdf-parse`: PDF 파일 파싱
- `xlsx`: Excel 파일 처리
- `multer`: 파일 업로드
- `sharp`: 이미지 처리
- `tesseract.js`: OCR 처리

### 보안 및 인증
- `jsonwebtoken`: JWT 토큰
- `bcrypt`: 비밀번호 해싱

### 유틸리티
- `dotenv`: 환경 변수 관리
- `winston`: 로깅
- `node-cron`: 작업 스케줄링

## 환경 변수 설정 (.env 파일)

```env
# 데이터베이스
MONGODB_URI=mongodb://localhost:27017/kis_erp
SQLITE_PATH=./database/kis.db
POSTGRES_URL=postgresql://user:password@localhost:5432/kis_erp

# AI API 키
OPENAI_API_KEY=sk-your-openai-key
CLAUDE_API_KEY=sk-ant-your-claude-key
GEMINI_API_KEY=your-gemini-key

# 이메일
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SENDGRID_API_KEY=SG.your-sendgrid-key

# SMS
SMS_API_KEY=your-sms-api-key
SMS_SENDER=KIS

# 보안
JWT_SECRET=your-jwt-secret-key
BCRYPT_ROUNDS=10

# 서버
PORT=3000
NODE_ENV=development
```

## 사용 방법

1. Claude Desktop 앱을 종료합니다.
2. 설정 파일을 위 경로에 생성/수정합니다.
3. 필요한 환경 변수를 설정합니다.
4. Claude Desktop 앱을 다시 시작합니다.
5. MCP 서버가 자동으로 로드됩니다.

## 주의사항

- API 키와 비밀번호는 안전하게 관리하세요.
- 환경 변수는 `.env` 파일에 저장하고 `.gitignore`에 추가하세요.
- 일부 MCP 서버는 공식 패키지가 없을 수 있으므로 대체 솔루션을 사용하세요.
- MCP 서버 설정은 Claude Desktop 버전에 따라 다를 수 있습니다.

## 문제 해결

1. MCP 서버가 로드되지 않는 경우:
   - 설정 파일 경로 확인
   - JSON 문법 오류 확인
   - Claude Desktop 재시작

2. 권한 오류:
   - 파일/폴더 접근 권한 확인
   - 관리자 권한으로 실행

3. API 연결 실패:
   - API 키 유효성 확인
   - 네트워크 연결 확인
   - 방화벽 설정 확인