# Claude Code MCP 서버 설정 가이드

## 설치된 MCP 서버 목록

### 🔧 핵심 개발 도구
- **filesystem**: 파일 시스템 작업
- **git**: Git 저장소 관리
- **memory**: 메모리 기반 데이터 저장
- **sequentialthinking**: 순차적 사고 프로세스

### 🏭 CAD 통합 서버
- **cad-mcp**: AutoCAD, GstarCAD, ZWCAD 지원
- **autocad-mcp**: AutoCAD LT 2024/2025 전용 AutoLISP
- **freecad-mcp**: FreeCAD 프로그래밍 제어

### 📄 OCR 및 문서 처리
- **textin-ocr**: TextIn API 기반 OCR
- **ocr-general**: 범용 OCR 처리
- **pdf-reader**: PDF 문서 분석 및 읽기

### 🌐 웹 및 검색 도구
- **e2b-sandbox**: 보안 코드 실행 샌드박스
- **exa-search**: AI 전용 검색 엔진
- **browserbase**: 클라우드 브라우저 자동화

## Claude Code 설정 방법

### 1. Claude Code 설정 파일 위치
```
C:\\Users\\PC\\.claude\\claude_desktop_config.json
```

### 2. 설정 파일에 추가할 내용
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\\\Users\\\\PC\\\\Desktop\\\\KIS_CORE_V2"]
    },
    "git": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "C:\\\\Users\\\\PC\\\\Desktop\\\\KIS_CORE_V2"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequentialthinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequentialthinking"]
    },
    "cad-mcp": {
      "command": "python",
      "args": ["C:\\\\Users\\\\PC\\\\Desktop\\\\KIS_CORE_V2\\\\mcp-servers\\\\cad-mcp\\\\src\\\\server.py"]
    },
    "autocad-mcp": {
      "command": "python",
      "args": ["C:\\\\Users\\\\PC\\\\Desktop\\\\KIS_CORE_V2\\\\mcp-servers\\\\autocad-mcp\\\\server_lisp_fast.py"]
    },
    "freecad-mcp": {
      "command": "python",
      "args": ["-m", "freecad_mcp.server"],
      "env": {
        "PYTHONPATH": "C:\\\\Users\\\\PC\\\\Desktop\\\\KIS_CORE_V2\\\\mcp-servers\\\\freecad-mcp\\\\src"
      }
    },
    "textin-ocr": {
      "command": "python",
      "args": ["C:\\\\Users\\\\PC\\\\Desktop\\\\KIS_CORE_V2\\\\mcp-servers\\\\textin-mcp\\\\server.py"]
    },
    "ocr-general": {
      "command": "python", 
      "args": ["C:\\\\Users\\\\PC\\\\Desktop\\\\KIS_CORE_V2\\\\mcp-servers\\\\ocr-mcp\\\\server.py"]
    },
    "pdf-reader": {
      "command": "python",
      "args": ["C:\\\\Users\\\\PC\\\\Desktop\\\\KIS_CORE_V2\\\\mcp-servers\\\\pdf-reader-mcp\\\\main.py"]
    },
    "e2b-sandbox": {
      "command": "python",
      "args": ["C:\\\\Users\\\\PC\\\\Desktop\\\\KIS_CORE_V2\\\\mcp-servers\\\\e2b-mcp\\\\src\\\\e2b_mcp\\\\server.py"]
    },
    "exa-search": {
      "command": "python",
      "args": ["C:\\\\Users\\\\PC\\\\Desktop\\\\KIS_CORE_V2\\\\mcp-servers\\\\exa-mcp\\\\src\\\\exa_mcp\\\\server.py"]
    },
    "browserbase": {
      "command": "python",
      "args": ["C:\\\\Users\\\\PC\\\\Desktop\\\\KIS_CORE_V2\\\\mcp-servers\\\\browserbase-mcp\\\\src\\\\mcp_server_browserbase\\\\server.py"]
    }
  }
}
```

### 3. 개별 서버 테스트 방법

#### CAD 서버 테스트
```bash
# CAD-MCP 서버 시작
cd C:\\Users\\PC\\Desktop\\KIS_CORE_V2\\mcp-servers\\cad-mcp
python src/server.py

# AutoCAD MCP 서버 시작 (AutoCAD가 설치된 경우)
cd C:\\Users\\PC\\Desktop\\KIS_CORE_V2\\mcp-servers\\autocad-mcp
python server_lisp_fast.py
```

#### OCR 서버 테스트
```bash
# TextIn OCR 서버 (API 키 필요)
cd C:\\Users\\PC\\Desktop\\KIS_CORE_V2\\mcp-servers\\textin-mcp
python server.py

# 범용 OCR 서버
cd C:\\Users\\PC\\Desktop\\KIS_CORE_V2\\mcp-servers\\ocr-mcp
python server.py
```

## 환경 변수 설정

### API 키가 필요한 서버들:
- **TextIn OCR**: TEXTIN_API_KEY
- **Exa Search**: EXA_API_KEY
- **E2B Sandbox**: E2B_API_KEY
- **Browserbase**: BROWSERBASE_API_KEY

### 환경 변수 설정 방법:
```bash
# .env 파일 생성
echo "TEXTIN_API_KEY=your_api_key_here" >> .env
echo "EXA_API_KEY=your_api_key_here" >> .env
echo "E2B_API_KEY=your_api_key_here" >> .env
echo "BROWSERBASE_API_KEY=your_api_key_here" >> .env
```

## 사용 예시

### CAD 도면 작업
```
Claude Code에서 다음과 같이 요청:
"AutoCAD를 사용해서 간단한 사각형을 그려주세요"
"FreeCAD로 3D 박스를 만들어주세요"
```

### OCR 문서 처리
```
"이 이미지에서 텍스트를 추출해주세요"
"PDF 파일의 내용을 분석해주세요"
```

### 코드 실행 및 테스트
```
"E2B 샌드박스에서 이 Python 코드를 실행해주세요"
"브라우저 자동화로 웹사이트를 테스트해주세요"
```

## 문제 해결

### 일반적인 문제들:
1. **Python 경로 문제**: PYTHONPATH 환경 변수 확인
2. **권한 문제**: 관리자 권한으로 실행
3. **포트 충돌**: 다른 포트 사용 또는 기존 프로세스 종료
4. **API 키 오류**: 환경 변수 설정 확인

### 로그 확인:
각 MCP 서버는 별도의 로그를 생성합니다. 문제 발생 시 해당 서버의 로그를 확인하세요.

## 추가 정보

전체 MCP 서버 소스코드는 다음 위치에 있습니다:
```
C:\\Users\\PC\\Desktop\\KIS_CORE_V2\\mcp-servers\\
```

각 서버의 자세한 사용법은 해당 디렉토리의 README.md 파일을 참조하세요.