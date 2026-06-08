-- MeetingHub AI — Supabase 스키마 (학습용 베이스)
-- PRD §15 데이터베이스 기준. 컬럼 타입/제약은 각자 보완.

-- 기업
create table companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz default now()
);

-- 회원 (Supabase auth.users와 연동)
create table users (
  id         uuid primary key references auth.users(id),
  email      text not null unique,
  name       text,
  created_at timestamptz default now()
);

-- 기업 구성원 (회원 ↔ 기업 N:M, 역할)
create table company_members (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references users(id),
  company_id    uuid references companies(id),
  department_id uuid,
  position_id   uuid,
  role          text not null default 'MEMBER',  -- ADMIN | MEMBER
  created_at    timestamptz default now()
);

-- 부서
create table departments (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  name       text not null,
  parent_id  uuid references departments(id)
);

-- 직급
create table positions (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  name       text not null,
  level      int
);

-- 초대
create table invitations (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  email      text not null,
  token      text not null unique,
  accepted   boolean default false,
  created_at timestamptz default now()
);

-- 회의실
create table meeting_rooms (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  name       text not null,
  location   text,
  capacity   int
);

-- 회의 예약
create table meeting_reservations (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid references meeting_rooms(id),
  title        text not null,
  start_at     timestamptz not null,
  end_at       timestamptz not null,
  status       text not null default 'RESERVED',  -- RESERVED | IN_PROGRESS | DONE | CANCELLED
  organizer_id uuid references users(id),
  created_at   timestamptz default now()
);

-- 참석자
create table reservation_attendees (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid references meeting_reservations(id),
  user_id        uuid references users(id)
);

-- 회의록
create table meeting_minutes (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid references meeting_reservations(id),
  content        text,
  created_by     uuid references users(id),
  created_at     timestamptz default now()
);

-- AI 분석 결과
create table ai_summaries (
  id         uuid primary key default gen_random_uuid(),
  minute_id  uuid references meeting_minutes(id),
  summary    text,
  key_points jsonb,
  decisions  jsonb,
  risks      jsonb,
  created_at timestamptz default now()
);

-- 업무 (Action Item)
create table action_items (
  id          uuid primary key default gen_random_uuid(),
  minute_id   uuid references meeting_minutes(id),
  assignee_id uuid references users(id),
  task        text not null,
  due_date    date,
  status      text not null default 'TODO',  -- TODO | IN_PROGRESS | DONE | BLOCKED
  created_at  timestamptz default now()
);

-- 알림
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id),
  type       text not null,  -- MEETING_REMINDER | TASK_ASSIGNED | INVITE
  message    text not null,
  is_read    boolean default false,
  created_at timestamptz default now()
);

-- TODO: 각 테이블 RLS(Row Level Security) 정책으로 company_id 기반 멀티테넌트 격리 적용
