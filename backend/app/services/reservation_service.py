"""담당: 김승현 — 회의 예약 (중복 검증 / 참석자)"""


class ReservationService:
    def list(self) -> list[dict]:
        raise NotImplementedError

    def create(self, data: dict) -> dict:
        # TODO: 같은 회의실 시간대 중복 예약 검증 후 생성
        raise NotImplementedError

    def get(self, reservation_id: str) -> dict:
        raise NotImplementedError

    def update(self, reservation_id: str, data: dict) -> dict:
        raise NotImplementedError

    def cancel(self, reservation_id: str) -> dict:
        # TODO: status = CANCELLED
        raise NotImplementedError

    def add_attendees(self, reservation_id: str, data: dict) -> dict:
        raise NotImplementedError
