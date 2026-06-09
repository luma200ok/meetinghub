"""Pydantic 요청/응답 스키마. 도메인별로 분리하거나 여기서 확장."""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum
from typing import Optional


# ---- Enum ----
class TaskStatus(str, Enum):
    TODO = 'TODO'
    IN_PROGRESS = 'IN_PROGRESS'
    DONE = 'DONE'
    BLOCKED = 'BLOCKED'


class ReservationStatus(str, Enum):
    RESERVED = 'RESERVED'
    IN_PROGRESS = 'IN_PROGRESS'
    DONE = 'DONE'
    CANCELLED = 'CANCELLED'


# ---- Auth ----
class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class InviteRequest(BaseModel):
    email: EmailStr
    company_id: str


class AcceptInviteRequest(BaseModel):
    token: str
    password: str


class CompanyCreateRequest(BaseModel):
    name: str


class DepartmentCreateRequest(BaseModel):
    name: str
    parent_id: Optional[str] = None


class DepartmentUpdateRequest(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None


class PositionCreateRequest(BaseModel):
    name: str
    level: Optional[int] = None


# ---- 예시: 회의 예약 (나머지는 각자 추가) ----
class ReservationCreateRequest(BaseModel):
    room_id: str
    title: str
    start_at: datetime
    end_at: datetime
    user_ids: Optional[list[str]] = None  # 참석자 ID 목록


class ReservationUpdateRequest(BaseModel):
    room_id: Optional[str] = None
    title: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    status: Optional[ReservationStatus] = None


class MeetingRoomCreateRequest(BaseModel):
    name: str
    location: Optional[str] = None
    capacity: Optional[int] = None


class MeetingRoomUpdateRequest(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None


class ReservationAttendeeAddRequest(BaseModel):
    user_ids: list[str]



# TODO: MeetingRoom / Minute / ActionItem / Notification 스키마 추가
