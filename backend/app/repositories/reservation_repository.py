from datetime import datetime, timedelta

from app.models.meeting import MeetingReservation


class ReservationRepository:
    def list_by_company(self, company_id: int) -> list[MeetingReservation]:
        now = datetime.now().replace(second=0, microsecond=0)
        return [
            MeetingReservation(1, company_id, "회의실 A", "API 설계 회의", "김승현", now + timedelta(hours=1), now + timedelta(hours=1, minutes=30), "RESERVED"),
            MeetingReservation(2, company_id, "회의실 B", "MVP 발표 리허설", "정재봉", now + timedelta(days=1), now + timedelta(days=1, hours=1), "RESERVED"),
        ]

    def has_room_conflict(self, room_id: int, starts_at: datetime, ends_at: datetime) -> bool:
        return False
