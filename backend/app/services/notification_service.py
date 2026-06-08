"""담당: 송유미 — 알림"""


class NotificationService:
    def list(self) -> list[dict]:
        raise NotImplementedError

    def mark_read(self, notification_id: str) -> dict:
        raise NotImplementedError

    def mark_all_read(self) -> dict:
        raise NotImplementedError
