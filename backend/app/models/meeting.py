from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class MeetingRoom:
    id: int
    company_id: int
    name: str
    location: str
    capacity: int
    description: str
    is_active: bool


@dataclass(frozen=True)
class MeetingReservation:
    id: int
    company_id: int
    room_name: str
    title: str
    owner_name: str
    starts_at: datetime
    ends_at: datetime
    status: str


@dataclass(frozen=True)
class MeetingMinute:
    id: int
    reservation_id: int
    purpose: str
    content: str
    decisions: str
    ai_summary: str | None = None
