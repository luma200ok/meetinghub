"""담당: 정재봉 — 대시보드 (PRD §13)

오늘 회의 / 내 업무 / 최근 회의 / 회의 통계 / 업무 통계를 한 번에 집계.
통계는 학습 단계라 단순 카운트로 구현 (데이터 많아지면 count 쿼리로 최적화).
"""
from datetime import datetime, timedelta, timezone

from flask import g

from app.utils.supabase import get_supabase

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
            .order('start_at', desc=True)
            .limit(5)
            .execute()
            .data
            or []
        )

        # 회의 통계
        reservations = (
            sb.table('meeting_reservations')
            .select('id, start_at')
            .eq('company_id', company_id)
            .execute()
            .data
            or []
        )
        week_iso = week_start.isoformat()
        this_week = sum(1 for r in reservations if (r.get('start_at') or '') >= week_iso)
        meeting_stats = {'total': len(reservations), 'this_week': this_week}

        # 업무 통계
        tasks = (
            sb.table('action_items')
            .select('status')
            .eq('company_id', company_id)
            .execute()
            .data
            or []
        )
        task_stats = {'todo': 0, 'in_progress': 0, 'done': 0, 'blocked': 0}
        for t in tasks:
            key = STATUS_KEY.get(t.get('status'))
            if key:
                task_stats[key] += 1

        return {
            'today_meetings': today_meetings,
            'my_tasks': my_tasks,
            'recent_meetings': recent_meetings,
            'meeting_stats': meeting_stats,
            'task_stats': task_stats,
        }

    def _company_id(self) -> str:
        company_id = getattr(g, 'company_id', None)
        if not company_id:
            raise ValueError('X-Company-Id 헤더가 필요합니다.')
        return company_id

    def _user_id(self) -> str:
        user_id = getattr(getattr(g, 'user', None), 'id', None)
        if not user_id:
            raise PermissionError('인증된 사용자를 확인할 수 없습니다.')
        return user_id
