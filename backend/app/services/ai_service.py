"""
ai_service.py
AI 분석 비즈니스 로직 — OpenAI GPT-4o mini 연동.
- analyze(minute_id)            : 회의록 → 요약/핵심논의/결정사항/위험요소 → ai_summaries 저장
- generate_action_items(minute_id): 회의록 → Action Items 추출 → action_items 저장
- get_summary(minute_id)        : ai_summaries 조회 (없으면 None)
"""
import json
import os
from typing import Optional

from flask import g

from app.errors import ApiError
from app.utils.supabase import get_supabase

# ── OpenAI 클라이언트 초기화 ──────────────────────────────────────────────────
try:
    from openai import OpenAI
    _openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))
except ImportError:
    _openai_client = None  # type: ignore

# 사용할 모델 — 비용 효율적인 gpt-4o-mini 기본값
_MODEL = "gpt-4o-mini"


class AiService:
    # ── 공개 인터페이스 ──────────────────────────────────────────────────────────

    def analyze(self, minute_id: str) -> dict:
        """
        회의록 내용을 GPT로 분석하여 ai_summaries 테이블에 저장/업데이트.
        이미 분석 결과가 있으면 덮어쓴다(재분석).
        """
        if _openai_client is None:
            raise ApiError(503, "OpenAI 라이브러리가 설치되지 않았습니다.")

        content = self._get_minute_content(minute_id)

        # GPT 호출
        prompt = self._build_analysis_prompt(content)
        raw = self._call_gpt(prompt)
        parsed = self._parse_json_response(raw, minute_id, "analyze")

        # ai_summaries upsert (같은 minute_id가 있으면 업데이트)
        sb = get_supabase()
        existing = (
            sb.table("ai_summaries")
            .select("id")
            .eq("minute_id", minute_id)
            .maybe_single()
            .execute()
            .data
        )

        record = {
            "minute_id": minute_id,
            "summary": parsed.get("summary", ""),
            "key_points": parsed.get("key_points", []),
            "decisions": parsed.get("decisions", []),
            "risks": parsed.get("risks", []),
        }

        if existing:
            result = (
                sb.table("ai_summaries")
                .update(record)
                .eq("id", existing["id"])
                .execute()
                .data[0]
            )
        else:
            result = (
                sb.table("ai_summaries")
                .insert(record)
                .execute()
                .data[0]
            )

        return result

    def generate_action_items(self, minute_id: str) -> list[dict]:
        """
        회의록 내용을 GPT로 분석하여 Action Items 추출 → action_items 테이블 저장.
        기존 AI 생성 Action Items는 삭제 후 재생성(중복 방지).
        """
        if _openai_client is None:
            raise ApiError(503, "OpenAI 라이브러리가 설치되지 않았습니다.")

        content = self._get_minute_content(minute_id)
        company_id = self._company_id()

        # GPT 호출
        prompt = self._build_action_items_prompt(content)
        raw = self._call_gpt(prompt)
        items_raw = self._parse_json_response(raw, minute_id, "action_items")

        if not isinstance(items_raw, list):
            raise ApiError(502, "AI 응답 형식이 올바르지 않습니다.")

        sb = get_supabase()

        # 기존 AI 자동 생성 Action Items 삭제 (수동 생성 것은 유지)
        # ai_generated=true 컬럼이 없으므로, 편의상 전체 삭제 후 재삽입
        sb.table("action_items").delete().eq("minute_id", minute_id).eq("company_id", company_id).execute()

        # 새 Action Items 일괄 삽입
        insert_list = []
        for item in items_raw[:10]:  # 최대 10개
            task = (item.get("task") or "").strip()
            if not task:
                continue
            insert_list.append({
                "minute_id": minute_id,
                "company_id": company_id,
                "task": task,
                "due_date": item.get("due_date"),  # None 이면 null
                "status": "TODO",
            })

        if not insert_list:
            return []

        rows = sb.table("action_items").insert(insert_list).execute().data or []
        return rows

    def get_summary(self, minute_id: str) -> Optional[dict]:
        """ai_summaries 단건 조회. 없으면 None 반환."""
        sb = get_supabase()
        result = (
            sb.table("ai_summaries")
            .select("*")
            .eq("minute_id", minute_id)
            .maybe_single()
            .execute()
            .data
        )
        return result

    # ── 내부 헬퍼 ────────────────────────────────────────────────────────────────

    def _get_minute_content(self, minute_id: str) -> str:
        """회의록 내용 조회. 없거나 비어있으면 ApiError."""
        sb = get_supabase()
        row = (
            sb.table("meeting_minutes")
            .select("content, company_id")
            .eq("id", minute_id)
            .maybe_single()
            .execute()
            .data
        )
        if row is None:
            raise ApiError(404, "회의록을 찾을 수 없습니다.")

        # company 격리 검증 (g.company_id 가 있을 때만)
        company_id = self._company_id()
        if row.get("company_id") != company_id:
            raise ApiError(403, "이 회의록에 접근할 권한이 없습니다.")

        content = (row.get("content") or "").strip()
        if not content:
            raise ApiError(400, "회의록 내용이 없습니다. 먼저 회의록을 작성해 주세요.")
        return content

    def _call_gpt(self, messages: list[dict]) -> str:
        """OpenAI ChatCompletion 호출 후 텍스트 반환."""
        try:
            response = _openai_client.chat.completions.create(  # type: ignore[union-attr]
                model=_MODEL,
                messages=messages,
                temperature=0.3,
                max_tokens=2000,
                response_format={"type": "json_object"},
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            raise ApiError(502, f"AI 분석 중 오류가 발생했습니다: {str(exc)}")

    def _parse_json_response(self, raw: str, minute_id: str, mode: str):
        """GPT JSON 응답 파싱. 실패 시 ApiError."""
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            raise ApiError(502, f"AI 응답을 파싱할 수 없습니다 (mode={mode}, minute_id={minute_id})")

    def _build_analysis_prompt(self, content: str) -> list[dict]:
        """회의록 분석용 GPT 프롬프트 (한국어 출력)."""
        return [
            {
                "role": "system",
                "content": (
                    "당신은 전문 회의 분석 AI입니다. "
                    "주어진 회의록을 분석하여 다음 JSON 형식으로 정확히 응답하세요. "
                    "모든 텍스트는 한국어로 작성하세요.\n\n"
                    "{\n"
                    '  "summary": "회의 전체 요약 (2-3문장)",\n'
                    '  "key_points": ["핵심 논의 사항 1", "핵심 논의 사항 2", ...],\n'
                    '  "decisions": ["결정 사항 1", "결정 사항 2", ...],\n'
                    '  "risks": ["위험 요소 또는 주의 사항 1", ...]\n'
                    "}"
                ),
            },
            {
                "role": "user",
                "content": f"다음 회의록을 분석해 주세요:\n\n{content}",
            },
        ]

    def _build_action_items_prompt(self, content: str) -> list[dict]:
        """Action Items 추출용 GPT 프롬프트 (한국어 출력)."""
        return [
            {
                "role": "system",
                "content": (
                    "당신은 전문 회의 분석 AI입니다. "
                    "회의록에서 Action Items(실행 항목)을 추출하여 다음 JSON 형식으로 응답하세요. "
                    "반드시 배열을 'items' 키 안에 넣어주세요. 모든 텍스트는 한국어로.\n\n"
                    "{\n"
                    '  "items": [\n'
                    '    {"task": "구체적인 업무 내용", "due_date": "YYYY-MM-DD 또는 null"},\n'
                    "    ...\n"
                    "  ]\n"
                    "}"
                ),
            },
            {
                "role": "user",
                "content": f"다음 회의록에서 Action Items를 추출해 주세요:\n\n{content}",
            },
        ]

    def _company_id(self) -> str:
        company_id = getattr(g, "company_id", None)
        if not company_id:
            raise ApiError(400, "X-Company-Id 헤더가 필요합니다.")
        return company_id

    def _parse_action_items_raw(self, raw_parsed) -> list[dict]:
        """action_items 파싱: items 키 또는 리스트 직접."""
        if isinstance(raw_parsed, list):
            return raw_parsed
        if isinstance(raw_parsed, dict):
            return raw_parsed.get("items", [])
        return []
