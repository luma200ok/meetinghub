from app.repositories.base import BaseRepository
from app.utils.supabase import get_supabase


class ActionItemRepository(BaseRepository):
    table_name = 'action_items'

    def list_in_company(
        self,
        company_id: str,
        status: str | None = None,
        assignee_id: str | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[dict]:
        query = self.table.select('*').eq('company_id', company_id)
        if status:
            query = query.eq('status', status)
        if assignee_id:
            query = query.eq('assignee_id', assignee_id)
        query = query.order('created_at', desc=True)
        if limit is not None:
            start = offset or 0
            query = query.range(start, start + max(limit, 1) - 1)
        rows = query.execute().data or []
        return self._attach_assignees(rows)

    def find_in_company(self, task_id: str, company_id: str) -> dict | None:
        rows = (
            self.table.select('*')
            .eq('id', task_id)
            .eq('company_id', company_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        return rows[0] if rows else None

    def update_in_company(self, task_id: str, company_id: str, data: dict) -> dict:
        rows = (
            self.table.update(data)
            .eq('id', task_id)
            .eq('company_id', company_id)
            .execute()
            .data
            or []
        )
        return rows[0] if rows else {}

    def _attach_assignees(self, rows: list[dict]) -> list[dict]:
        """담당자(user) 정보를 한 번에 묶어서 붙인다 (N+1 방지)."""
        assignee_ids = [r['assignee_id'] for r in rows if r.get('assignee_id')]
        if not assignee_ids:
            return rows
        users = (
            get_supabase()
            .table('users')
            .select('id, email, name')
            .in_('id', list(set(assignee_ids)))
            .execute()
            .data
            or []
        )
        user_map = {u['id']: u for u in users}
        return [{**r, 'assignee': user_map.get(r.get('assignee_id'))} for r in rows]
