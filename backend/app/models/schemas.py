"""Pydantic 요청/응답 스키마. 도메인별로 분리하거나 여기서 확장."""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum


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


# ---- 예시: 회의 예약 (나머지는 각자 추가) ----
class ReservationCreateRequest(BaseModel):
    room_id: str
    title: str
    start_at: datetime
    end_at: datetime


# TODO: Company / Department / Position / MeetingRoom /
#       Minute / ActionItem / Notification 스키마 추가
