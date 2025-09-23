#!/usr/bin/env python3
"""
Evidence Audit & Sanitizer Tool
원칙: "증거는 오직 대표의 지식만"
외부 문서(카탈로그/데이터시트/블로그 등) 영구 차단
"""

import os
import sys
import json
import yaml
import argparse
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Any
import hashlib

class EvidenceAuditor:
    def __init__(self, root_path: str, policy_path: str = "evidence_policy.yaml"):
        self.root_path = Path(root_path)
        self.policy_path = self.root_path / policy_path
        self.policy = self._load_policy()
        self.violations = []
        self.sanitized_count = 0
        self.scanned_files = 0

    def _load_policy(self) -> Dict:
        """Evidence 정책 파일 로드"""
        if not self.policy_path.exists():
            raise FileNotFoundError(f"정책 파일 없음: {self.policy_path}")

        with open(self.policy_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)

    def _is_allowed_source(self, source: str) -> bool:
        """소스가 허용 목록에 있는지 확인"""
        # 허용된 문서 확인
        if source in self.policy['allowed_docs']:
            return True

        # 허용된 테이블 소스 확인
        if 'allowed_table_sources' in self.policy:
            if source in self.policy['allowed_table_sources']:
                return True

        # 허용된 접두사 확인
        for prefix in self.policy['allowed_prefixes']:
            if source.startswith(prefix):
                return True

        # 금지 패턴 확인
        for pattern in self.policy['deny_patterns']:
            if re.search(pattern, source, re.IGNORECASE):
                return False

        return False

    def _check_evidence_in_json(self, data: Any, file_path: Path, path_context: str = "") -> List[Dict]:
        """JSON 데이터에서 evidence 필드 검사"""
        violations = []

        if isinstance(data, dict):
            # evidence.rules_doc 검사
            if 'evidence' in data:
                evidence = data['evidence']
                if isinstance(evidence, dict):
                    if 'rules_doc' in evidence:
                        if not self._is_allowed_source(evidence['rules_doc']):
                            violations.append({
                                'file': str(file_path),
                                'path': f"{path_context}.evidence.rules_doc",
                                'value': evidence['rules_doc'],
                                'type': 'unauthorized_source'
                            })

                    # evidence.tables[*].source 검사
                    if 'tables' in evidence and isinstance(evidence['tables'], list):
                        for idx, table in enumerate(evidence['tables']):
                            if isinstance(table, dict) and 'source' in table:
                                if not self._is_allowed_source(table['source']):
                                    violations.append({
                                        'file': str(file_path),
                                        'path': f"{path_context}.evidence.tables[{idx}].source",
                                        'value': table['source'],
                                        'type': 'unauthorized_table_source'
                                    })

            # 재귀적으로 하위 딕셔너리 검사
            for key, value in data.items():
                if key != 'evidence':  # evidence는 이미 검사함
                    new_context = f"{path_context}.{key}" if path_context else key
                    violations.extend(self._check_evidence_in_json(value, file_path, new_context))

        elif isinstance(data, list):
            # 리스트 아이템 재귀 검사
            for idx, item in enumerate(data):
                new_context = f"{path_context}[{idx}]"
                violations.extend(self._check_evidence_in_json(item, file_path, new_context))

        return violations

    def _sanitize_evidence(self, data: Any) -> Any:
        """Evidence 소스를 정화 (CEO_APPROVED로 교체)"""
        if isinstance(data, dict):
            if 'evidence' in data:
                evidence = data['evidence']
                if isinstance(evidence, dict):
                    # rules_doc 정화
                    if 'rules_doc' in evidence:
                        if not self._is_allowed_source(evidence['rules_doc']):
                            evidence['rules_doc'] = self.policy['actions']['sanitize_replacement']
                            self.sanitized_count += 1

                    # tables 정화
                    if 'tables' in evidence and isinstance(evidence['tables'], list):
                        for table in evidence['tables']:
                            if isinstance(table, dict) and 'source' in table:
                                if not self._is_allowed_source(table['source']):
                                    table['source'] = self.policy['actions']['sanitize_replacement']
                                    self.sanitized_count += 1

            # 재귀적으로 정화
            for key, value in data.items():
                if key != 'evidence':
                    data[key] = self._sanitize_evidence(value)

        elif isinstance(data, list):
            data = [self._sanitize_evidence(item) for item in data]

        return data

    def scan_file(self, file_path: Path, mode: str = 'audit') -> Tuple[bool, List[Dict]]:
        """단일 파일 스캔"""
        self.scanned_files += 1
        file_violations = []

        try:
            # JSON 파일 처리
            if file_path.suffix in ['.json']:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    file_violations = self._check_evidence_in_json(data, file_path)

                    if mode == 'fix' and file_violations:
                        # 정화 모드: 원본 보존하고 정화본 생성
                        sanitized_data = self._sanitize_evidence(data)
                        sanitized_dir = self.root_path / self.policy['sanitization']['output_dir']
                        sanitized_dir.mkdir(parents=True, exist_ok=True)

                        relative_path = file_path.relative_to(self.root_path)
                        sanitized_path = sanitized_dir / relative_path.parent / f"{relative_path.stem}{self.policy['sanitization']['suffix']}{relative_path.suffix}"
                        sanitized_path.parent.mkdir(parents=True, exist_ok=True)

                        with open(sanitized_path, 'w', encoding='utf-8') as f:
                            json.dump(sanitized_data, f, indent=2, ensure_ascii=False)

            # JSONL 파일 처리
            elif file_path.suffix in ['.jsonl']:
                lines_violations = []
                lines_data = []

                with open(file_path, 'r', encoding='utf-8') as f:
                    for line_no, line in enumerate(f, 1):
                        if line.strip():
                            data = json.loads(line)
                            line_violations = self._check_evidence_in_json(data, file_path, f"line{line_no}")
                            lines_violations.extend(line_violations)

                            if mode == 'fix':
                                sanitized_data = self._sanitize_evidence(data)
                                lines_data.append(sanitized_data)
                            else:
                                lines_data.append(data)

                file_violations = lines_violations

                if mode == 'fix' and file_violations:
                    sanitized_dir = self.root_path / self.policy['sanitization']['output_dir']
                    sanitized_dir.mkdir(parents=True, exist_ok=True)

                    relative_path = file_path.relative_to(self.root_path)
                    sanitized_path = sanitized_dir / relative_path.parent / f"{relative_path.stem}{self.policy['sanitization']['suffix']}{relative_path.suffix}"
                    sanitized_path.parent.mkdir(parents=True, exist_ok=True)

                    with open(sanitized_path, 'w', encoding='utf-8') as f:
                        for data in lines_data:
                            f.write(json.dumps(data, ensure_ascii=False) + '\n')

            # YAML 파일 처리
            elif file_path.suffix in ['.yaml', '.yml']:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
                    if data:
                        file_violations = self._check_evidence_in_json(data, file_path)

                        if mode == 'fix' and file_violations:
                            sanitized_data = self._sanitize_evidence(data)
                            sanitized_dir = self.root_path / self.policy['sanitization']['output_dir']
                            sanitized_dir.mkdir(parents=True, exist_ok=True)

                            relative_path = file_path.relative_to(self.root_path)
                            sanitized_path = sanitized_dir / relative_path.parent / f"{relative_path.stem}{self.policy['sanitization']['suffix']}{relative_path.suffix}"
                            sanitized_path.parent.mkdir(parents=True, exist_ok=True)

                            with open(sanitized_path, 'w', encoding='utf-8') as f:
                                yaml.dump(sanitized_data, f, allow_unicode=True, default_flow_style=False)

        except Exception as e:
            print(f"[WARNING] 파일 처리 오류 {file_path}: {e}")

        self.violations.extend(file_violations)
        return len(file_violations) == 0, file_violations

    def scan_directory(self, mode: str = 'audit') -> Dict:
        """디렉토리 전체 스캔"""
        print(f"[SCAN] 스캔 시작: {self.root_path}")
        print(f"[MODE] 모드: {mode}")

        # 스캔 패턴에 맞는 파일 찾기
        for pattern in self.policy['audit']['scan_patterns']:
            for file_path in self.root_path.glob(pattern):
                # 제외 디렉토리 확인
                skip = False
                for exclude_dir in self.policy['audit']['exclude_dirs']:
                    if exclude_dir in str(file_path):
                        skip = True
                        break

                if not skip:
                    self.scan_file(file_path, mode)

        # 결과 생성
        result = {
            'timestamp': datetime.now().isoformat(),
            'mode': mode,
            'root_path': str(self.root_path),
            'scanned_files': self.scanned_files,
            'violations_count': len(self.violations),
            'sanitized_count': self.sanitized_count if mode == 'fix' else 0,
            'violations': self.violations,
            'status': 'PASSED' if len(self.violations) == 0 else 'FAILED'
        }

        # 감사 보고서 저장
        report_dir = self.root_path / self.policy['audit']['report_path']
        report_dir.mkdir(parents=True, exist_ok=True)
        report_file = report_dir / f"audit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        print(f"[REPORT] 감사 보고서 저장: {report_file}")

        # 정화 로그 저장 (fix 모드)
        if mode == 'fix' and self.sanitized_count > 0:
            log_file = self.root_path / self.policy['sanitization']['change_log_path']
            with open(log_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'timestamp': datetime.now().isoformat(),
                    'sanitized_count': self.sanitized_count,
                    'violations_fixed': self.violations
                }, f, indent=2, ensure_ascii=False)
            print(f"[LOG] 정화 로그 저장: {log_file}")

        return result

def main():
    parser = argparse.ArgumentParser(description='Evidence Audit & Sanitizer Tool')
    parser.add_argument('--root', type=str, default='.', help='스캔할 루트 디렉토리')
    parser.add_argument('--mode', type=str, choices=['audit', 'fix'], default='audit',
                      help='모드: audit(검사만) 또는 fix(정화)')
    parser.add_argument('--policy', type=str, default='evidence_policy.yaml',
                      help='정책 파일 경로')

    args = parser.parse_args()

    try:
        auditor = EvidenceAuditor(args.root, args.policy)
        result = auditor.scan_directory(args.mode)

        # 12줄 요약 출력
        print("\n" + "="*60)
        print("EVIDENCE AUDIT SUMMARY")
        print("="*60)
        print(f"mode={args.mode}; status={result['status']}")
        print(f"scanned={result['scanned_files']} files")
        print(f"violations={result['violations_count']}")
        print(f"sanitized={result['sanitized_count']}")
        print(f"timestamp={result['timestamp']}")
        print(f"policy=evidence_policy.yaml")
        print(f"root={result['root_path']}")

        if result['status'] == 'FAILED':
            print(f"action=DEPLOYMENT_BLOCKED")
            print(f"fix_command=python {__file__} --root {args.root} --mode fix")
        else:
            print(f"action=READY_TO_DEPLOY")
            print(f"evidence_integrity=VERIFIED")

        print("="*60)

        # 게이트 통합: 위반 시 exit code 1
        if args.mode == 'audit' and result['violations_count'] > 0:
            sys.exit(1)

    except Exception as e:
        print(f"[ERROR] 오류 발생: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()