from app.repositories.base import BaseRepository
from app.utils.supabase import get_supabase


class ActionItemRepository(BaseRepository):
    table_name = 'action_items'
    # select('*') 대신 명시 컬럼 (P3) — 스키마 변경 시 영향 범위 명확화 + 불필요 전송 방지
    _COLUMNS = 'id, company_id, minute_id, assignee_id, task, due_date, status, created_at'

    def list_in_company(
        self,
        company_id: str,
        status: str | None = None,
        assignee_id: str | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[dict]:
        query = self.table.select(self._COLUMNS).eq('company_id', company_id)
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

    def create(
        self,
        company_id: str,
        task: str,
        assignee_id: str | None = None,
        due_date: str | None = None,
        minute_id: str | None = None,
    ) -> dict:
        """수동 업무 생성(#45). minute_id 없이도 생성 가능(스키마상 nullable)."""
        payload: dict = {'company_id': company_id, 'task': task, 'status': 'TODO'}
        if assignee_id is not None:
            payload['assignee_id'] = assignee_id
        if due_date is not None:
            payload['due_date'] = due_date
        if minute_id is not None:
            payload['minute_id'] = minute_id
        rows = self.table.insert(payload).execute().data or []
        created = rows[0] if rows else payload
        return self._attach_assignees([created])[0]

    def find_in_company(self, task_id: str, company_id: str) -> dict | None:
        rows = (
            self.table.select(self._COLUMNS)
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
        # 업데이트 대상이 없으면(동시 삭제 등 TOCTOU) 무음 빈 응답 대신 404 처리
        if not rows:
            raise LookupError('업무를 찾을 수 없습니다.')
        return rows[0]

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
