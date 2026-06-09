"""
action_item_repository.py
action_items 테이블 CRUD — 회사(company_id) 단위 멀티테넌트 격리 포함.
"""
from typing import Optional
from app.repositories.base import BaseRepository
from app.utils.supabase import get_supabase


class ActionItemRepository(BaseRepository):
    table_name = "action_items"

    # ── 조회 ────────────────────────────────────────────────────────────────────

    def list_by_minute(self, minute_id: str, company_id: str) -> list[dict]:
        """특정 회의록의 Action Items 목록 (company 격리)."""
        rows = (
            self.table
            .select("*")
            .eq("minute_id", minute_id)
            .eq("company_id", company_id)
            .order("created_at", desc=False)
            .execute()
            .data or []
        )
        # 담당자 이름 일괄 조회
        return self._enrich_assignee_names(rows)

    def list_by_company(self, company_id: str) -> list[dict]:
        """회사 전체 Action Items 목록."""
        rows = (
            self.table
            .select("*")
            .eq("company_id", company_id)
            .order("created_at", desc=True)
            .execute()
            .data or []
        )
        return self._enrich_assignee_names(rows)

    def find_by_id_and_company(self, item_id: str, company_id: str) -> Optional[dict]:
        """단건 조회 + company 소속 검증."""
        row = (
            self.table
            .select("*")
            .eq("id", item_id)
            .eq("company_id", company_id)
            .maybe_single()
            .execute()
            .data
        )
        if row is None:
            return None
        return self._enrich_assignee_names([row])[0]

    # ── 생성 / 수정 / 삭제 ──────────────────────────────────────────────────────

    def create(self, minute_id: str, company_id: str, task: str,
               assignee_id: Optional[str] = None,
               due_date: Optional[str] = None,
               status: str = "TODO") -> dict:
        """Action Item 단건 생성."""
        payload = {
            "minute_id": minute_id,
            "company_id": company_id,
            "task": task,
            "status": status,
        }
        if assignee_id:
            payload["assignee_id"] = assignee_id
        if due_date:
            payload["due_date"] = due_date

        row = (
            self.table
            .insert(payload)
            .execute()
            .data[0]
        )
        return self._enrich_assignee_names([row])[0]

    def bulk_create(self, items: list[dict]) -> list[dict]:
        """AI 생성 Action Items 일괄 삽입."""
        if not items:
            return []
        rows = (
            self.table
            .insert(items)
            .execute()
            .data or []
        )
        return self._enrich_assignee_names(rows)

    def update(self, item_id: str, data: dict) -> dict:
        """상태·내용·담당자·기한 업데이트."""
        row = (
            self.table
            .update(data)
            .eq("id", item_id)
            .execute()
            .data[0]
        )
        return self._enrich_assignee_names([row])[0]

    def delete(self, item_id: str) -> None:
        self.table.delete().eq("id", item_id).execute()

    def delete_by_minute(self, minute_id: str) -> None:
        """회의록 삭제 시 연관 Action Items 일괄 삭제."""
        self.table.delete().eq("minute_id", minute_id).execute()

    def minute_belongs_to_company(self, minute_id: str, company_id: str) -> bool:
        """회의록이 해당 company에 속하는지 검증."""
        sb = get_supabase()
        row = (
            sb.table("meeting_minutes")
            .select("id")
            .eq("id", minute_id)
            .eq("company_id", company_id)
            .maybe_single()
            .execute()
            .data
        )
        return row is not None

    # ── 내부 헬퍼 ────────────────────────────────────────────────────────────────

    def _enrich_assignee_names(self, rows: list[dict]) -> list[dict]:
        """assignee_id → assignee_name 변환 (users 테이블 일괄 조회)."""
        if not rows:
            return rows

        assignee_ids = list({r["assignee_id"] for r in rows if r.get("assignee_id")})
        user_map: dict = {}
        if assignee_ids:
            sb = get_supabase()
            users = (
                sb.table("users")
                .select("id, name")
                .in_("id", assignee_ids)
                .execute()
                .data or []
            )
            user_map = {u["id"]: u.get("name") for u in users}

        return [
            {
                **r,
                "assignee_name": user_map.get(r.get("assignee_id")) if r.get("assignee_id") else None,
            }
            for r in rows
        ]
