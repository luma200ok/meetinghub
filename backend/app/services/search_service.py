"""담당: 정재봉 — 통합 검색

q 로 예약(회의)/회의록/업무를 한 번에 부분 일치(ilike) 검색.
모두 company_id 로 격리한다.
"""
from flask import g

from app.utils.supabase import get_supabase

RESULT_LIMIT = 20


class SearchService:
    def search(self, query: str) -> dict:
        q = (query or '').strip()
        empty = {'reservations': [], 'minutes': [], 'tasks': []}
        if not q:
            return empty

        company_id = self._company_id()
        sb = get_supabase()
        pattern = f'%{q}%'

        reservations = (
            sb.table('meeting_reservations')
            .select('id, title, status, start_at')
            .eq('company_id', company_id)
            .ilike('title', pattern)
            .limit(RESULT_LIMIT)
            .execute()
            .data
            or []
        )
        minutes = (
            sb.table('meeting_minutes')
            .select('id, content, reservation_id')
            .eq('company_id', company_id)
            .ilike('content', pattern)
            .limit(RESULT_LIMIT)
            .execute()
            .data
            or []
        )
        tasks = (
            sb.table('action_items')
            .select('id, task, status, due_date')
            .eq('company_id', company_id)
            .ilike('task', pattern)
            .limit(RESULT_LIMIT)
            .execute()
            .data
            or []
        )

        return {'reservations': reservations, 'minutes': minutes, 'tasks': tasks}

    def _company_id(self) -> str:
        company_id = getattr(g, 'company_id', None)
        if not company_id:
            raise ValueError('X-Company-Id 헤더가 필요합니다.')
        return company_id
