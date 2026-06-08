-- MeetingHub AI — Supabase 스키마 (학습용 베이스)
-- PRD §15 데이터베이스 기준. 컬럼 타입/제약은 각자 보완.
--
-- ⚠️ 이 스키마는 이미 Supabase(meetinghub 프로젝트)에 적용되어 있습니다.
--    팀원은 다시 실행할 필요 없음. 새 컬럼/테이블이 필요하면
--    이 파일에 추가 + 본인 브랜치 PR + 마이그레이션으로 반영하세요.

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

-- 기업 구성원 (회원 ↔ 기업 N:M, 역할)
create table company_members (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references users(id),
  company_id    uuid references companies(id),
  department_id uuid references departments(id),
  position_id   uuid references positions(id),
  role          text not null default 'MEMBER',  -- ADMIN | MEMBER
  created_at    timestamptz default now()
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

-- ---------------------------------------------------------------
-- RLS (행 수준 보안) — 전 테이블 활성화, 정책 0개
-- 데이터 접근은 백엔드(Flask, service_role 키)만 가능. service_role은 RLS를 무시함.
-- 프론트의 anon/publishable 키로는 테이블 직접 접근 불가(전부 차단) → 멀티테넌트 격리.
-- 프론트가 Supabase로 직접 데이터를 다뤄야 하면 그때 company_id 기반 정책을 추가하세요.
-- ---------------------------------------------------------------
alter table companies            enable row level security;
alter table users                enable row level security;
alter table departments          enable row level security;
alter table positions            enable row level security;
alter table company_members      enable row level security;
alter table invitations          enable row level security;
alter table meeting_rooms        enable row level security;
alter table meeting_reservations enable row level security;
alter table reservation_attendees enable row level security;
alter table meeting_minutes      enable row level security;
alter table ai_summaries         enable row level security;
alter table action_items         enable row level security;
alter table notifications        enable row level security;
