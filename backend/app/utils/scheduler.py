"""APScheduler 기반 5분 전 알림 스케줄러"""

from datetime import datetime, timedelta, timezone

# pyrefly: ignore [missing-import]
from apscheduler.schedulers.background import BackgroundScheduler


_scheduler: BackgroundScheduler | None = None


def start_scheduler(app) -> None:
    global _scheduler

    # 이미 실행 중이면 중복 실행 방지
    if _scheduler and _scheduler.running:
        return

    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        _send_upcoming_meeting_notifications,
        trigger="interval",
        minutes=1,
        id="meeting_reminder",
        args=[app],
        replace_existing=True,
    )
    _scheduler.start()


def stop_scheduler() -> None:
    global _scheduler

    if _scheduler and _scheduler.running:
        _scheduler.shutdown()

    _scheduler = None


def _send_upcoming_meeting_notifications(app) -> None:
    """5분 후 시작 예정 회의 알림 발송"""

    with app.app_context():
        from app.utils.supabase import get_supabase

        sb = get_supabase()
        now = datetime.now(timezone.utc)

        # 스케줄러가 1분마다 실행되므로, 현재 기준 4~6분 뒤 시작하는 회의를 조회
        window_start = (now + timedelta(minutes=4)).isoformat()
        window_end = (now + timedelta(minutes=6)).isoformat()

        reservations = (
            sb.table("meeting_reservations")
            .select("id, title, organizer_id, start_at")
            .gte("start_at", window_start)
            .lte("start_at", window_end)
            .eq("status", "RESERVED")
            .execute()
        )

        for rsv in reservations.data:
            reservation_id = rsv.get("id")
            organizer_id = rsv.get("organizer_id")
            title = rsv.get("title")

            if not reservation_id or not title:
                continue

            message = f"'{title}' 회의가 5분 후 시작됩니다."

            # 회의 참석자 조회
            attendees = (
                sb.table("reservation_attendees")
                .select("user_id")
                .eq("reservation_id", reservation_id)
                .execute()
            )

            # 알림 대상자 목록 생성
            # 주최자 + 참석자를 모두 포함하고, set으로 중복 제거
            target_user_ids = set()

            if organizer_id:
                target_user_ids.add(organizer_id)

            for attendee in attendees.data:
                attendee_user_id = attendee.get("user_id")
                if attendee_user_id:
                    target_user_ids.add(attendee_user_id)

            # 대상자별 알림 생성
            for user_id in target_user_ids:
                # 중복 알림 방지
                # 같은 사용자에게 같은 회의 알림 메시지가 이미 있으면 다시 생성하지 않음
                existing = (
                    sb.table("notifications")
                    .select("id")
                    .eq("user_id", user_id)
                    .eq("type", "MEETING_REMINDER")
                    .eq("message", message)
                    .limit(1)
                    .execute()
                )

                if existing.data:
                    continue

                sb.table("notifications").insert(
                    {
                        "user_id": user_id,
                        "type": "MEETING_REMINDER",
                        "message": message,
                        "is_read": False,
                    }
                ).execute()

        # for rsv in reservations.data:
        #     user_id = rsv.get('organizer_id')
        #     title = rsv.get('title')

        #     if not user_id or not title:
        #         continue

        #     message = f"'{title}' 회의가 5분 후 시작됩니다."

        #     # 중복 알림 방지
        #     existing = (
        #         sb.table('notifications')
        #         .select('id')
        #         .eq('user_id', user_id)
        #         .eq('type', 'MEETING_REMINDER')
        #         .eq('message', message)
        #         .limit(1)
        #         .execute()
        #     )

        #     if existing.data:
        #         continue

        #     sb.table('notifications').insert({
        #         'user_id': user_id,
        #         'type': 'MEETING_REMINDER',
        #         'message': message,
        #         'is_read': False,
        #     }).execute()