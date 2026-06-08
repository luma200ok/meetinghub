from datetime import datetime, timedelta

from app.repositories.reservation_repository import ReservationRepository


class ReservationService:
    def __init__(self):
        self.reservation_repository = ReservationRepository()

    def list_reservations(self, company_id: int):
        return self.reservation_repository.list_by_company(company_id)

    def calculate_end_time(self, starts_at: datetime, duration_minutes: int) -> datetime:
        return starts_at + timedelta(minutes=duration_minutes)

    def validate_room_availability(self, room_id: int, starts_at: datetime, duration_minutes: int) -> bool:
        ends_at = self.calculate_end_time(starts_at, duration_minutes)
        return not self.reservation_repository.has_room_conflict(room_id, starts_at, ends_at)
