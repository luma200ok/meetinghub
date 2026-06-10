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
from app.services.tenant_guard import require_member_company
from app.utils.supabase import get_supabase, single_or_none

# ── AI 클라이언트 (OpenAI / Gemini OpenAI-호환) ────────────────────────────────
# 호출 시점에 키를 읽어 클라이언트를 만든다(키 교체+재시작 즉시 반영).
# OpenAI(sk-...) 와 Gemini(OpenAI 호환 엔드포인트)를 모두 지원한다:
#   - OPENAI_API_KEY 가 sk- 로 시작 → OpenAI 그대로
#   - 그 외 키(예: Gemini) + AI_BASE_URL 미지정 → Gemini OpenAI-호환 엔드포인트로 자동 전환
#   - AI_BASE_URL / AI_MODEL 로 명시 지정도 가능(타 호환 엔드포인트)
try:
    from openai import OpenAI
except ImportError:  # pragma: no cover
    OpenAI = None  # type: ignore

_OPENAI_DEFAULT_MODEL = "gpt-4o-mini"
_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
# 무료 티어 쿼터가 가장 안정적인 모델. (gemini-2.0-flash 는 일부 계정 무료 티어 limit:0)
# 필요 시 Render 의 AI_MODEL 로 override 가능.
_GEMINI_DEFAULT_MODEL = "gemini-1.5-flash"


def _resolve_ai_config():
    """(api_key, base_url, model) 결정. 키가 sk- 가 아니면 Gemini 로 자동 전환."""
    api_key = (os.environ.get("OPENAI_API_KEY") or "").strip()
    base_url = (os.environ.get("AI_BASE_URL") or "").strip() or None
    model = (os.environ.get("AI_MODEL") or "").strip()
    if api_key and not api_key.startswith("sk-") and base_url is None:
        # Gemini 키로 간주 → OpenAI 호환 엔드포인트 + Gemini 모델
        base_url = _GEMINI_BASE_URL
        model = model or _GEMINI_DEFAULT_MODEL
    if not model:
        model = _OPENAI_DEFAULT_MODEL
    return api_key, base_url, model


def _get_openai_client():
    """현재 설정으로 AI 클라이언트를 만든다. 미설치/키누락은 503."""
    if OpenAI is None:
        raise ApiError(503, "OpenAI 라이브러리가 설치되지 않았습니다.")
    api_key, base_url, _ = _resolve_ai_config()
    if not api_key:
        raise ApiError(503, "AI API 키가 설정되지 않았습니다. (OPENAI_API_KEY)")
    kwargs = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    return OpenAI(**kwargs)


class AiService:
    # ── 공개 인터페이스 ──────────────────────────────────────────────────────────

    def analyze(self, minute_id: str) -> dict:
        """
        회의록 내용을 GPT로 분석하여 ai_summaries 테이블에 저장/업데이트.
        이미 분석 결과가 있으면 덮어쓴다(재분석).
        """
        content = self._get_minute_content(minute_id)

        # GPT 호출
        prompt = self._build_analysis_prompt(content)
        raw = self._call_gpt(prompt)
        parsed = self._parse_json_response(raw, minute_id, "analyze")

        # ai_summaries upsert (같은 minute_id가 있으면 업데이트)
        sb = get_supabase()
        existing = single_or_none(
            sb.table("ai_summaries").select("id").eq("minute_id", minute_id).maybe_single()
        )

        record = {
            "minute_id": minute_id,
            "summary": parsed.get("summary", ""),
            "key_points": parsed.get("key_points", []),
            "decisions": parsed.get("decisions", []),
            "risks": parsed.get("risks", []),
        }

        if existing:
            rows = sb.table("ai_summaries").update(record).eq("id", existing["id"]).execute().data or []
        else:
            rows = sb.table("ai_summaries").insert(record).execute().data or []
        return rows[0] if rows else record

    def generate_action_items(self, minute_id: str) -> list[dict]:
        """
        회의록 내용을 GPT로 분석하여 Action Items 추출 → action_items 테이블 저장.
        기존 AI 생성 Action Items는 삭제 후 재생성(중복 방지).
        """
        content = self._get_minute_content(minute_id)
        company_id = self._company_id()

        # GPT 호출
        prompt = self._build_action_items_prompt(content)
        raw = self._call_gpt(prompt)
        parsed = self._parse_json_response(raw, minute_id, "action_items")
        # 프롬프트가 {"items":[...]} 형식을 요구하므로 응답은 dict 다. 기존엔 isinstance(list)
        # 체크로 항상 502 가 떴음 → items 키를 추출하는 헬퍼로 리스트를 얻는다.
        items_raw = self._parse_action_items_raw(parsed)

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
        """ai_summaries 단건 조회. 없으면 None 반환.

        ai_summaries 에는 company_id 컬럼이 없어 minute_id 만으로 조회하면 타 회사
        AI 요약이 노출되는 IDOR 가 된다. 요청자가 해당 회의록 소속 회사의 구성원인지
        먼저 검증하고, 아니면(또는 회의록이 타 회사면) 없는 것으로 취급해 정보 노출을 막는다.
        """
        company_id = require_member_company()
        sb = get_supabase()
        minute = single_or_none(
            sb.table("meeting_minutes").select("company_id").eq("id", minute_id).maybe_single()
        )
        if minute is None or minute.get("company_id") != company_id:
            return None
        return single_or_none(
            sb.table("ai_summaries").select("*").eq("minute_id", minute_id).maybe_single()
        )

    # ── 내부 헬퍼 ────────────────────────────────────────────────────────────────

    def _get_minute_content(self, minute_id: str) -> str:
        """회의록 내용 조회. 없거나 비어있으면 ApiError."""
        sb = get_supabase()
        row = single_or_none(
            sb.table("meeting_minutes").select("content, company_id").eq("id", minute_id).maybe_single()
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
        """ChatCompletion 호출 후 텍스트 반환 (OpenAI / Gemini 호환)."""
        client = _get_openai_client()
        _, _, model = _resolve_ai_config()
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.3,
                max_tokens=2000,
                response_format={"type": "json_object"},
            )
            return response.choices[0].message.content or ""
        except ApiError:
            raise
        except Exception as exc:
            msg = str(exc)
            low = msg.lower()
            if "api key" in low or "api_key_invalid" in low or "invalid_api_key" in low or "error code: 401" in low:
                raise ApiError(502, "AI API 키가 올바르지 않습니다. (OPENAI_API_KEY / 엔드포인트 확인 — OpenAI는 sk-, Gemini는 AI_BASE_URL 자동)")
            raise ApiError(502, f"AI 분석 중 오류가 발생했습니다: {msg}")

    def _parse_json_response(self, raw: str, minute_id: str, mode: str):
        """JSON 응답 파싱. ```json 펜스로 감싼 경우(Gemini 등)도 처리. 실패 시 ApiError."""
        text = (raw or "").strip()
        if text.startswith("```"):
            lines = text.split("\n")
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        try:
            return json.loads(text)
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
        # 헤더(X-Company-Id)만 신뢰하면 cross-tenant IDOR(타 회사 회의록 분석/요약/액션아이템
        # 열람·수정·삭제)이 가능하므로, #49 표준대로 멤버십까지 교차검증한다.
        return require_member_company()

    def _parse_action_items_raw(self, raw_parsed) -> list[dict]:
        """action_items 파싱: items 키 또는 리스트 직접."""
        if isinstance(raw_parsed, list):
            return raw_parsed
        if isinstance(raw_parsed, dict):
            return raw_parsed.get("items", [])
        return []
