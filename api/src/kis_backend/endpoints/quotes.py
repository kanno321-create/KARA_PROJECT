"""
견적 생성 API 엔드포인트
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..utils.time import ensure_utc


# Pydantic 모델 정의
class QuoteRequest(BaseModel):
    """견적 요청 모델"""
    product_id: str = Field(..., description="제품 ID", example="C999")
    quantity: int = Field(..., ge=1, description="수량", example=1)
    option: str = Field(..., description="옵션", example="basic")
    mode: str = Field(..., description="모드", example="fast")


class QuoteResponse(BaseModel):
    """견적 응답 모델"""
    quote_id: str = Field(..., description="견적 ID", example="Q-123456")
    amount: float = Field(..., description="견적 금액", example=198.0)
    timestamp: str = Field(..., description="생성 시간")
    product_id: str = Field(..., description="제품 ID")
    quantity: int = Field(..., description="수량")
    option: str = Field(..., description="옵션")
    mode: str = Field(..., description="모드")


# 라우터 생성
router = APIRouter(prefix="/v1", tags=["quotes"])


# 견적 계산 로직 (간단한 예시)
def calculate_quote_amount(product_id: str, quantity: int, option: str, mode: str) -> float:
    """
    견적 금액 계산 함수

    Args:
        product_id: 제품 ID
        quantity: 수량
        option: 옵션
        mode: 모드

    Returns:
        계산된 견적 금액
    """
    # 기본 가격표 (실제로는 데이터베이스나 외부 서비스에서 조회)
    base_prices = {
        "C999": 150.0,
        "C888": 200.0,
        "C777": 120.0,
    }

    # 옵션별 배율
    option_multipliers = {
        "basic": 1.0,
        "premium": 1.5,
        "enterprise": 2.0,
    }

    # 모드별 배율
    mode_multipliers = {
        "fast": 1.2,
        "standard": 1.0,
        "economy": 0.8,
    }

    # 기본 가격 조회
    base_price = base_prices.get(product_id, 100.0)

    # 옵션 배율 적용
    option_multiplier = option_multipliers.get(option, 1.0)

    # 모드 배율 적용
    mode_multiplier = mode_multipliers.get(mode, 1.0)

    # 최종 금액 계산
    total_amount = base_price * quantity * option_multiplier * mode_multiplier

    return round(total_amount, 2)


@router.post("/quotes", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
async def create_quote(request: QuoteRequest) -> QuoteResponse:
    """
    견적 생성 API

    Args:
        request: 견적 요청 데이터

    Returns:
        생성된 견적 정보

    Raises:
        HTTPException: 잘못된 요청 시 422 오류
    """
    try:
        # 견적 ID 생성 (Q- 접두사 + 6자리 랜덤)
        quote_id = f"Q-{str(uuid.uuid4())[:6].upper()}"

        # 견적 금액 계산
        amount = calculate_quote_amount(
            product_id=request.product_id,
            quantity=request.quantity,
            option=request.option,
            mode=request.mode
        )

        # 현재 시간 생성
        timestamp = ensure_utc(datetime.utcnow()).isoformat().replace("+00:00", "Z")

        # 응답 생성
        response = QuoteResponse(
            quote_id=quote_id,
            amount=amount,
            timestamp=timestamp,
            product_id=request.product_id,
            quantity=request.quantity,
            option=request.option,
            mode=request.mode
        )

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "quote_calculation_failed",
                "message": f"견적 계산 중 오류가 발생했습니다: {str(e)}",
                "traceId": str(uuid.uuid4())
            }
        )


@router.get("/quotes/health")
async def quotes_health():
    """견적 서비스 상태 확인"""
    return {
        "service": "quotes",
        "status": "healthy",
        "timestamp": ensure_utc(datetime.utcnow()).isoformat().replace("+00:00", "Z")
    }