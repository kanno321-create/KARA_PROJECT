"""
KaraProject ngrok API JIT Plugin
ChatGPT/Codex와 MCP 서버 간의 연결을 위한 플러그인
"""

import requests
from typing import Optional, List, Dict, Any

# MCP 서버 설정
BASE_URL = "http://localhost:8765/v1"   # MCP 서버 로컬 주소
NGROK_URL = "https://karaproject.ngrok.app/v1"  # ngrok 외부 주소 (백업)

def relayOrder(
    target: str,
    title: str,
    order: str,
    accept_criteria: str = None,
    attachments: list = None
) -> Dict[str, Any]:
    """
    새로운 작업 요청을 MCP 서버 큐에 등록합니다.

    Args:
        target: 워커 대상 ("gpt5_codex" 또는 "claude_code")
        title: 작업 제목
        order: 작업 내용
        accept_criteria: 완료 기준
        attachments: 첨부 파일 리스트

    Returns:
        생성된 작업의 job_id와 상태 정보
    """
    payload = {
        "target": target,
        "title": title,
        "order": order,
        "accept_criteria": accept_criteria,
        "attachments": attachments or []
    }
    try:
        response = requests.post(f"{BASE_URL}/orders", json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error relaying order: {e}")
        # Fallback to ngrok URL if local fails
        try:
            response = requests.post(f"{NGROK_URL}/orders", json=payload)
            response.raise_for_status()
            return response.json()
        except:
            raise

def getOrderStatus(job_id: str) -> Dict[str, Any]:
    """
    특정 작업의 상세 정보와 현재 상태를 조회합니다.

    Args:
        job_id: 조회할 작업 ID (예: "gpt5_codex_2025-09-27T12:00:00.000000Z")

    Returns:
        작업의 상세 정보 (title, order, accept_criteria, status 등)
    """
    try:
        response = requests.get(f"{BASE_URL}/get_order_detail/{job_id}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error getting order status: {e}")
        # Fallback to ngrok URL if local fails
        try:
            response = requests.get(f"{NGROK_URL}/get_order_detail/{job_id}")
            response.raise_for_status()
            return response.json()
        except:
            raise

def getOrdersFor(role: str) -> Dict[str, Any]:
    """
    특정 워커(role)에게 할당된 작업 목록을 조회합니다.

    Args:
        role: 워커 타입 ("gpt5_codex" 또는 "claude_code")

    Returns:
        해당 워커에 할당된 작업 목록
        {
            "ok": True,
            "jobs": [
                {
                    "job_id": "...",
                    "title": "...",
                    "order": "..."
                },
                ...
            ]
        }

    Examples:
        >>> orders = getOrdersFor("claude_code")
        >>> print(f"Claude Code has {len(orders['jobs'])} pending orders")

        >>> gpt_orders = getOrdersFor("gpt5_codex")
        >>> for job in gpt_orders['jobs']:
        ...     print(f"- {job['job_id']}: {job['title']}")
    """
    try:
        response = requests.get(f"{BASE_URL}/get_orders_for/{role}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error getting orders for {role}: {e}")
        # Fallback to ngrok URL if local fails
        try:
            response = requests.get(f"{NGROK_URL}/get_orders_for/{role}")
            response.raise_for_status()
            return response.json()
        except:
            raise

# Convenience functions for common operations
def get_claude_orders() -> Dict[str, Any]:
    """Claude Code 워커의 작업 목록을 가져옵니다."""
    return getOrdersFor("claude_code")

def get_gpt_orders() -> Dict[str, Any]:
    """GPT5 Codex 워커의 작업 목록을 가져옵니다."""
    return getOrdersFor("gpt5_codex")

def create_claude_order(title: str, order: str, accept_criteria: str = "") -> Dict[str, Any]:
    """Claude Code용 작업을 생성합니다."""
    return relayOrder(
        target="claude_code",
        title=title,
        order=order,
        accept_criteria=accept_criteria or f"Complete the task: {title}"
    )

def create_gpt_order(title: str, order: str, accept_criteria: str = "") -> Dict[str, Any]:
    """GPT5 Codex용 작업을 생성합니다."""
    return relayOrder(
        target="gpt5_codex",
        title=title,
        order=order,
        accept_criteria=accept_criteria or f"Complete the task: {title}"
    )

# Test functions
def test_connection() -> bool:
    """MCP 서버 연결을 테스트합니다."""
    try:
        response = requests.get(f"{BASE_URL}/health")
        return response.status_code == 200
    except:
        try:
            response = requests.get(f"{NGROK_URL}/health")
            return response.status_code == 200
        except:
            return False

if __name__ == "__main__":
    # 테스트 코드
    print("Testing MCP Server Connection...")
    if test_connection():
        print("[OK] Connected to MCP Server")

        # Claude Code 작업 목록 조회
        print("\n[Claude Code Orders]")
        claude_orders = get_claude_orders()
        if claude_orders.get("ok"):
            jobs = claude_orders.get("jobs", [])
            print(f"  Found {len(jobs)} orders")
            for job in jobs:
                print(f"  - {job['job_id']}: {job['title']}")

        # GPT5 Codex 작업 목록 조회
        print("\n[GPT5 Codex Orders]")
        gpt_orders = get_gpt_orders()
        if gpt_orders.get("ok"):
            jobs = gpt_orders.get("jobs", [])
            print(f"  Found {len(jobs)} orders")
            for job in jobs:
                print(f"  - {job['job_id']}: {job['title']}")
    else:
        print("[ERROR] Failed to connect to MCP Server")