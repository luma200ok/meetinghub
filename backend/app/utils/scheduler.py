"""APScheduler 기반 5분 전 알림 스케줄러"""
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta, timezone


_scheduler: BackgroundScheduler | None = None


def start_scheduler() -> None:
    global _scheduler
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        _send_upcoming_meeting_notifications,
        trigger='interval',
        minutes=1,
        id='meeting_reminder',
    )
    _scheduler.start()


def stop_scheduler() -> None:
    if _scheduler:
        _scheduler.shutdown()


def _send_upcoming_meeting_notifications() -> None:
    """5분 후 시작 예정 회의 알림 발송"""
    from app.utils.supabase import get_supabase
    from flask import current_app

    with current_app.app_context():
        sb = get_supabase()
        now = datetime.now(timezone.utc)
        window_start = (now + timedelta(minutes=4)).isoformat()
        window_end   = (now + timedelta(minutes=6)).isoformat()

        reservations = (
            sb.table('meeting_reservations')
            .select('id, title, organizer_id')
            .gte('start_at', window_start)
            .lte('start_at', window_end)
            .eq('status', 'RESERVED')
            .execute()
        )

        for rsv in reservations.data:
            sb.table('notifications').insert({
                'user_id':  rsv['organizer_id'],
                'type':     'MEETING_REMINDER',
                'message':  f"'{rsv['title']}' 회의가 5분 후 시작됩니다.",
                'is_read':  False,
            }).execute()
