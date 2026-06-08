"""담당: 김승현 — 회의실 관리"""


class MeetingRoomService:
    def list(self) -> list[dict]:
        raise NotImplementedError

    def create(self, data: dict) -> dict:
        raise NotImplementedError

    def update(self, room_id: str, data: dict) -> dict:
        raise NotImplementedError

    def delete(self, room_id: str) -> None:
        raise NotImplementedError
