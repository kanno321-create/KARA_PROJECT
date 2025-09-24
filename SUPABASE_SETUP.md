# Supabase 배포 설정 가이드

이 가이드는 KIS ERP 시스템의 Supabase 자동 배포를 설정하는 방법을 설명합니다.

## 1. Supabase 프로젝트 준비

### 1.1 프로젝트 정보 확보
1. [Supabase Dashboard](https://app.supabase.com/) 접속
2. 프로젝트 선택
3. **Project Ref** 확인:
   - 프로젝트 대시보드 URL에서 확인: `https://app.supabase.com/project/[PROJECT_REF]`
   - 또는 Settings → General → Reference ID

### 1.2 Access Token 발급
1. Dashboard → Account → Access Tokens
2. "Generate new token" 클릭
3. 토큰 이름 입력 (예: "KIS_ERP_DEPLOY")
4. 생성된 토큰 복사 (한 번만 표시됨)

### 1.3 DB Password (선택사항)
- 원격 DB 직접 접속이 필요한 경우만
- Project Settings → Database → Database password

## 2. GitHub Secrets 등록

### 2.1 Repository Settings 접근
1. GitHub 리포지토리 페이지로 이동
2. Settings → Secrets and variables → Actions

### 2.2 필수 Secrets 추가
다음 secrets를 추가하세요:

```
SUPABASE_PROJECT_REF
값: [1.1에서 확인한 Project Ref]

SUPABASE_ACCESS_TOKEN
값: [1.2에서 발급한 Access Token]
```

### 2.3 선택적 Secrets
필요한 경우에만 추가:

```
SUPABASE_DB_PASSWORD
값: [1.3에서 확인한 DB Password]
```

## 3. 워크플로우 동작 확인

### 3.1 자동 트리거
다음 경우에 자동으로 실행됩니다:
- `supabase/` 디렉토리 파일 변경 시
- `master` 또는 `main` 브랜치 푸시 시

### 3.2 수동 실행
1. GitHub Actions → "Deploy to Supabase" 선택
2. "Run workflow" 클릭
3. 로그에서 다음 확인:
   - `🔗 Linking to Supabase project...` 성공
   - `📊 Checking project status...` 성공

### 3.3 오류 해결
**"flag needs an argument: --project-ref"**
- `SUPABASE_PROJECT_REF` secret이 설정되지 않음
- 2.2 단계 재확인

**"Invalid project ref"**
- Project Ref 값이 잘못됨
- 1.1 단계에서 올바른 값 확인

**"Unauthorized"**
- Access Token이 잘못되거나 만료됨
- 1.2 단계에서 새 토큰 발급

## 4. 배포 현황

### 4.1 활성화된 워크플로우
- `Deploy to Supabase`: 전체 배포 프로세스
- `Supabase Deploy (Simple)`: 간단한 DB 배포

### 4.2 배포 내용
- **Database Migrations**: `supabase/migrations/` 폴더의 SQL 파일
- **Edge Functions**: `supabase/functions/` 폴더의 Deno 함수

### 4.3 조건부 실행
- GitHub Secrets가 설정되지 않은 경우 자동으로 스킵
- 오류 없이 안전하게 무시됨

## 5. 로컬 개발

### 5.1 Supabase CLI 설치
```bash
npm install -g supabase
```

### 5.2 프로젝트 연결
```bash
supabase login
supabase link --project-ref [YOUR_PROJECT_REF]
```

### 5.3 로컬 개발 서버
```bash
supabase start
```

---

## 지원 및 문의

설정 과정에서 문제가 발생하면 다음을 확인하세요:

1. **Supabase 프로젝트 상태**: Dashboard에서 정상 동작 확인
2. **GitHub Secrets**: 올바른 이름과 값으로 설정되어 있는지 확인
3. **워크플로우 로그**: Actions 탭에서 상세한 오류 메시지 확인

추가 지원이 필요한 경우 [GitHub Issues](https://github.com/kanno321-create/KARA_PROJECT/issues)에 문의하세요.