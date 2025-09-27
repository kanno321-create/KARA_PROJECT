#!/usr/bin/env python3
"""
FastAPI main.py 파일 찾기 스크립트

조건:
1. 파일명이 main.py
2. FastAPI 키워드 포함
3. app = FastAPI() 구문 포함
4. /quotes 라우트 정의 포함

사용법: python find_fastapi_main.py
"""

import os
import re
from pathlib import Path


def find_fastapi_main_files(start_dir="."):
    """
    조건에 맞는 main.py 파일들을 찾아 반환

    Args:
        start_dir (str): 검색 시작 디렉토리

    Returns:
        list: 조건을 만족하는 파일 경로 리스트
    """
    matching_files = []
    start_path = Path(start_dir).resolve()

    # 현재 디렉토리 하위의 모든 main.py 파일 찾기
    for main_file in start_path.rglob("main.py"):
        try:
            with open(main_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # 조건 1: FastAPI 키워드 포함
            if "FastAPI" not in content:
                continue

            # 조건 2: app = FastAPI() 구문 포함 (공백 허용)
            if not re.search(r'app\s*=\s*FastAPI\s*\(', content):
                continue

            # 조건 3: API 라우트 정의 포함 (quotes, orders 등)
            # @app.post("/quotes") 또는 @app.post("/orders") 등 API 라우트 찾기
            api_pattern = r'@app\.\w+\s*\(\s*["\'][^"\']*/?(?:quotes|orders|api)[^"\']*["\']'
            route_pattern = r'app\.include_router'  # router 포함도 허용

            if not (re.search(api_pattern, content) or re.search(route_pattern, content)):
                continue

            # 모든 조건을 만족하는 경우
            matching_files.append(str(main_file))

        except (UnicodeDecodeError, IOError) as e:
            # 파일 읽기 실패 시 건너뛰기
            print(f"[오류] 파일 읽기 실패: {main_file} - {e}")
            continue

    return matching_files


def main():
    """메인 실행 함수"""
    print("[검색] FastAPI main.py 파일 검색 중...")
    print("=" * 50)

    # 현재 디렉토리에서 검색 시작
    matching_files = find_fastapi_main_files(".")

    if matching_files:
        print(f"[성공] 조건을 만족하는 파일 {len(matching_files)}개 발견:")
        print()
        for file_path in matching_files:
            print(f"- {file_path}")
    else:
        print("[실패] 조건을 만족하는 파일을 찾을 수 없습니다.")

    print()
    print("=" * 50)
    print("[완료] 검색 완료")


if __name__ == "__main__":
    main()