from app.models.meeting import MeetingRoom


class MeetingRoomRepository:
    def list_by_company(self, company_id: int) -> list[MeetingRoom]:
        return [
            MeetingRoom(1, company_id, "회의실 A", "8F East", 8, "스크럼 및 일반 회의", True),
            MeetingRoom(2, company_id, "회의실 B", "8F West", 12, "프로젝트 킥오프", True),
            MeetingRoom(3, company_id, "Focus Room", "9F", 4, "소규모 집중 회의", False),
        ]
