from datetime import datetime, timedelta


class NotificationService:
    def should_send_meeting_start_notice(self, starts_at: datetime, now: datetime | None = None) -> bool:
        current = now or datetime.now()
        return current <= starts_at <= current + timedelta(minutes=5)
