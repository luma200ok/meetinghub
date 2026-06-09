"""담당: 정재봉 — 대시보드 (PRD §13)

오늘 회의 / 내 업무 / 최근 회의 / 회의 통계 / 업무 통계를 한 번에 집계.
통계는 학습 단계라 단순 카운트로 구현 (데이터 많아지면 count 쿼리로 최적화).
"""
from datetime import datetime, timedelta, timezone

from flask import g

from app.utils.supabase import get_supabase
from app.services.tenant_guard import require_member_company

STATUS_KEY = {
    'TODO': 'todo',
    'IN_PROGRESS': 'in_progress',
    'DONE': 'done',
    'BLOCKED': 'blocked',
}


class DashboardService:
    def get_summary(self) -> dict:
        company_id = self._company_id()
        user_id = self._user_id()
        sb = get_supabase()

        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        week_start = today_start - timedelta(days=today_start.weekday())

        today_meetings = (
            sb.table('meeting_reservations')
            .select('id, title, start_at, end_at, status')
            .eq('company_id', company_id)
            .gte('start_at', today_start.isoformat())
            .lt('start_at', today_end.isoformat())
            .order('start_at')
            .execute()
            .data
            or []
        )

        my_tasks = (
            sb.table('action_items')
            .select('id, task, status, due_date')
            .eq('company_id', company_id)
            .eq('assignee_id', user_id)
            .neq('status', 'DONE')
            .order('due_date')
            .limit(10)
            .execute()
            .data
            or []
        )

        recent_meetings = (
            sb.table('meeting_reservations')
            .select('id, title, start_at, status')
            .eq('company_id', company_id)
            .neq('status', 'CANCELLED')  # 취소된 회의는 '최근 회의'에서 제외 (PRD §13)
            .order('start_at', desc=True)
            .limit(5)
            .execute()
            .data
            or []
        )

        # 회의 통계 — 전체 행을 끌어오지 않고 count 쿼리로 집계(P2-3)
        week_iso = week_start.isoformat()
        total = self._count(sb, 'meeting_reservations', company_id)
        this_week = self._count(
            sb, 'meeting_reservations', company_id, lambda q: q.gte('start_at', week_iso)
        )
        meeting_stats = {'total': total, 'this_week': this_week}

        # 업무 통계 — 상태별 count 쿼리(P2-3)
        task_stats = {
            key: self._count(
                sb, 'action_items', company_id, lambda q, s=status: q.eq('status', s)
            )
            for status, key in STATUS_KEY.items()
        }

        return {
            'today_meetings': today_meetings,
            'my_tasks': my_tasks,
            'recent_meetings': recent_meetings,
            'meeting_stats': meeting_stats,
            'task_stats': task_stats,
        }

    def _count(self, sb, table: str, company_id: str, extra=None) -> int:
        """company 스코프 count 쿼리 (head=True 로 행을 끌어오지 않음)."""
        query = (
            sb.table(table)
            .select('id', count='exact', head=True)
            .eq('company_id', company_id)
        )
        if extra is not None:
            query = extra(query)
        return query.execute().count or 0

    def _company_id(self) -> str:
        return require_member_company()

    def _user_id(self) -> str:
        user_id = getattr(getattr(g, 'user', None), 'id', None)
        if not user_id:
            raise PermissionError('인증된 사용자를 확인할 수 없습니다.')
        return user_id
