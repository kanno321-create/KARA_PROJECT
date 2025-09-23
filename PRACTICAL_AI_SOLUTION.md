# 견적 AI 실용적 구현 방안

## 🏆 추천: Direct API + SQLite + 간단한 벡터 검색

LangChain 없이 직접 구현하는 것이 더 효율적입니다.

## 1단계: 기본 구조 설정

### 필요 패키지만 설치
```bash
pip install openai numpy scikit-learn sentence-transformers fastapi
```

### 핵심 AI 엔진
```python
import sqlite3
import json
import numpy as np
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

class PracticalEstimateAI:
    def __init__(self):
        # 심플한 설정
        self.openai = OpenAI(api_key="your-key")
        self.encoder = SentenceTransformer('jhgan/ko-sroberta-multitask')
        self.db = sqlite3.connect('estimates.db')
        self.init_database()

    def init_database(self):
        """견적 데이터베이스 초기화"""
        cursor = self.db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS estimates (
                id INTEGER PRIMARY KEY,
                project_name TEXT,
                specifications TEXT,
                estimate_data TEXT,
                embedding BLOB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        self.db.commit()

    def add_estimate(self, project_name, specs, estimate):
        """새 견적 저장"""
        # 텍스트를 벡터로 변환
        embedding = self.encoder.encode(specs)

        cursor = self.db.cursor()
        cursor.execute('''
            INSERT INTO estimates (project_name, specifications, estimate_data, embedding)
            VALUES (?, ?, ?, ?)
        ''', (project_name, specs, json.dumps(estimate), embedding.tobytes()))
        self.db.commit()

    def find_similar_estimates(self, specs, top_k=3):
        """유사한 견적 찾기"""
        # 입력을 벡터로 변환
        query_embedding = self.encoder.encode(specs)

        # DB에서 모든 견적 가져오기
        cursor = self.db.cursor()
        cursor.execute('SELECT id, specifications, estimate_data, embedding FROM estimates')
        rows = cursor.fetchall()

        if not rows:
            return []

        # 코사인 유사도 계산
        similarities = []
        for row in rows:
            stored_embedding = np.frombuffer(row[3], dtype=np.float32)
            similarity = cosine_similarity(
                query_embedding.reshape(1, -1),
                stored_embedding.reshape(1, -1)
            )[0][0]
            similarities.append({
                'id': row[0],
                'specs': row[1],
                'estimate': json.loads(row[2]),
                'similarity': similarity
            })

        # 상위 k개 반환
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        return similarities[:top_k]

    def generate_estimate(self, project_specs):
        """AI 견적 생성"""
        # 1. 유사 견적 검색
        similar = self.find_similar_estimates(project_specs)

        # 2. 컨텍스트 구성
        context = "참고할 유사 견적:\n"
        for est in similar:
            context += f"- 사양: {est['specs'][:100]}...\n"
            context += f"  견적: {json.dumps(est['estimate'], ensure_ascii=False)[:200]}...\n\n"

        # 3. GPT 호출 (심플하게)
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": f"""당신은 전문 견적 AI입니다.
                    다음 유사 견적을 참고하여 정확한 견적을 작성하세요:
                    {context}

                    견적은 다음 형식으로 작성:
                    - 품목명
                    - 규격
                    - 수량
                    - 단가
                    - 금액"""
                },
                {
                    "role": "user",
                    "content": f"다음 사양에 대한 견적을 작성해주세요:\n{project_specs}"
                }
            ],
            temperature=0.1,  # 일관성을 위해 낮게 설정
            max_tokens=2000
        )

        return response.choices[0].message.content

# 사용 예제
ai = PracticalEstimateAI()

# 견적 생성
estimate = ai.generate_estimate("""
제품: 분전반
메인차단기: 100A
분기차단기: 20A x 8개
외함: STS 600x800x200
""")

print(estimate)
```

## 2단계: FastAPI 서버

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import uvicorn

app = FastAPI(title="KIS 견적 AI API")
ai_engine = PracticalEstimateAI()

class EstimateRequest(BaseModel):
    project_name: str
    specifications: str

class EstimateResponse(BaseModel):
    estimate: str
    similar_projects: List[Dict]
    confidence_score: float

@app.post("/api/v1/estimate", response_model=EstimateResponse)
async def create_estimate(request: EstimateRequest):
    """견적 생성 API"""
    try:
        # 유사 프로젝트 찾기
        similar = ai_engine.find_similar_estimates(request.specifications)

        # 견적 생성
        estimate = ai_engine.generate_estimate(request.specifications)

        # 신뢰도 계산 (유사도 기반)
        confidence = similar[0]['similarity'] if similar else 0.5

        return EstimateResponse(
            estimate=estimate,
            similar_projects=similar,
            confidence_score=confidence
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/estimate/save")
async def save_estimate(
    project_name: str,
    specifications: str,
    estimate_data: Dict
):
    """생성된 견적 저장 (학습용)"""
    ai_engine.add_estimate(project_name, specifications, estimate_data)
    return {"status": "saved"}

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy"}

# 서버 실행
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 3단계: 점진적 개선

### Phase 1: MVP (1주일)
```python
# 1. SQLite + 기본 검색
# 2. OpenAI API 직접 호출
# 3. 간단한 웹 인터페이스
```

### Phase 2: 성능 개선 (2주일)
```python
# 1. Redis 캐싱 추가
import redis
cache = redis.Redis()

def get_cached_or_generate(specs):
    # 캐시 확인
    cached = cache.get(hash(specs))
    if cached:
        return cached

    # 생성 후 캐싱
    result = generate_estimate(specs)
    cache.setex(hash(specs), 3600, result)
    return result
```

### Phase 3: 정확도 향상 (1개월)
```python
# 1. Fine-tuning (선택적)
# 2. 더 많은 데이터 수집
# 3. A/B 테스트
```

## 4. 노코드 대안: Dify.ai 설정

### Dify.ai 워크플로우
1. **회원가입**: dify.ai
2. **앱 생성**: "견적 AI" 앱 생성
3. **지식베이스**: 과거 견적 업로드
4. **프롬프트 설정**:
   ```
   당신은 (주)한국산업의 견적 전문가입니다.
   업로드된 지식베이스를 참고하여 정확한 견적을 작성하세요.
   ```
5. **API 발행**: REST API 엔드포인트 생성
6. **통합**: 기존 시스템과 연결

### Dify 장점
- GUI로 모든 설정
- 자동 벡터화
- 다국어 지원
- API 제공
- 분석 대시보드

## 5. 비용 비교

| 솔루션 | 초기 비용 | 월 운영비 | 개발 기간 | 난이도 |
|--------|-----------|-----------|-----------|---------|
| **직접 구현** | 0원 | 10만원 | 2주 | 중 |
| **Dify.ai** | 0원 | 8만원 | 3일 | 하 |
| **Flowise** | 0원 | 5만원 | 1주 | 중 |
| **n8n** | 0원 | 3만원 | 1주 | 하 |
| **LangChain** | 0원 | 10만원 | 3주 | 상 |

## 6. 실행 스크립트

### setup.sh
```bash
#!/bin/bash
# 환경 설정
python -m venv venv
source venv/bin/activate

# 패키지 설치
pip install openai fastapi uvicorn sentence-transformers scikit-learn

# DB 초기화
python init_db.py

# 서버 실행
uvicorn main:app --reload
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  ai-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./data:/app/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## 결론

**LangChain 없이도 충분히 구현 가능합니다!**

1. **즉시 시작**: 위 코드로 바로 시작
2. **단순함**: 디버깅 쉽고 유지보수 간단
3. **성능**: 불필요한 레이어 없어 빠름
4. **비용 효율**: 최소한의 API 호출

이 방식이 더 실용적이고 관리하기 쉽습니다.