"""담당: 정재봉 — 통합 검색

q 로 예약(회의)/회의록/업무를 한 번에 부분 일치(ilike) 검색.
모두 company_id 로 격리한다.
"""
from app.utils.supabase import get_supabase
from app.services.tenant_guard import require_member_company

RESULT_LIMIT = 20


class SearchService:
    def search(self, query: str) -> dict:
        q = (query or '').strip()
        empty = {'reservations': [], 'minutes': [], 'tasks': []}
        if not q:
            return empty

        company_id = self._company_id()
        sb = get_supabase()
        pattern = f'%{self._escape_like(q)}%'

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

    def _escape_like(self, value: str) -> str:
        """검색어의 LIKE 와일드카드(%, _)와 이스케이프 문자(\\)를 리터럴로 처리(P2-2).

        PostgREST .ilike() 는 값을 파라미터로 바인딩하므로 SQL injection은 없으나,
        사용자가 입력한 %, _ 는 와일드카드로 해석되어 의도와 다른 광범위 매칭을 유발한다.
        backslash가 ILIKE의 기본 ESCAPE 문자이므로 \\, %, _ 순으로 이스케이프한다.
        """
        return (
            value.replace('\\', '\\\\')
            .replace('%', '\\%')
            .replace('_', '\\_')
        )

    def _company_id(self) -> str:
        return require_member_company()
