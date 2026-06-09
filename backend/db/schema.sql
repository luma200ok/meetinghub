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
-- company_id: 멀티테넌트 직접 격리용 (예약 생성 시 회의실의 company_id를 함께 저장)
create table meeting_reservations (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid references companies(id),
  room_id      uuid references meeting_rooms(id),
  title        text not null,
  start_at     timestamptz not null,
  end_at       timestamptz not null,
  status       text not null default 'RESERVED',  -- RESERVED | IN_PROGRESS | DONE | CANCELLED
  organizer_id uuid references users(id),
  created_at   timestamptz default now()
);
create index idx_meeting_reservations_company on meeting_reservations(company_id);

-- 참석자
create table reservation_attendees (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid references meeting_reservations(id),
  user_id        uuid references users(id)
);

-- 회의록
-- company_id: 멀티테넌트 직접 격리용 (회의록 생성 시 예약의 company_id를 함께 저장)
create table meeting_minutes (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid references companies(id),
  reservation_id uuid references meeting_reservations(id),
  content        text,
  created_by     uuid references users(id),
  created_at     timestamptz default now()
);
create index idx_meeting_minutes_company on meeting_minutes(company_id);

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
-- company_id: 멀티테넌트 직접 격리용 (생성 시 회의록의 company_id를 함께 저장)
create table action_items (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references companies(id),
  minute_id   uuid references meeting_minutes(id),
  assignee_id uuid references users(id),
  task        text not null,
  due_date    date,
  status      text not null default 'TODO',  -- TODO | IN_PROGRESS | DONE | BLOCKED
  created_at  timestamptz default now()
);
create index idx_action_items_company on action_items(company_id);

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
-- RLS (행 수준 보안)
-- 백엔드는 service_role 키(RLS bypass)로 접근하므로 Flask API에는 영향 없음.
-- 프론트가 Supabase anon/authenticated 키로 직접 조회할 때(또는 키 유출 시)를 대비한
-- defense-in-depth. 앱 코드의 company_id 필터링에 추가적인 보호 계층 제공.
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

-- 정책: company_id가 있는 테이블 — 해당 회사 멤버만 SELECT 가능
create policy "Users can view their own company's departments"
  on departments for select
  using (company_id in (select company_id from company_members where user_id = auth.uid()));

create policy "Users can view their own company's positions"
  on positions for select
  using (company_id in (select company_id from company_members where user_id = auth.uid()));

create policy "Users can view their own company members"
  on company_members for select
  using (company_id in (select company_id from company_members where user_id = auth.uid()));

create policy "Users can view their own company's meeting rooms"
  on meeting_rooms for select
  using (company_id in (select company_id from company_members where user_id = auth.uid()));

create policy "Users can view their own company's reservations"
  on meeting_reservations for select
  using (company_id in (select company_id from company_members where user_id = auth.uid()));

create policy "Users can view their own company's minutes"
  on meeting_minutes for select
  using (company_id in (select company_id from company_members where user_id = auth.uid()));

create policy "Users can view their own company's action items"
  on action_items for select
  using (company_id in (select company_id from company_members where user_id = auth.uid()));

create policy "Users can view invitations for their company"
  on invitations for select
  using (company_id in (select company_id from company_members where user_id = auth.uid()));

-- 정책: 참석자는 자신이 속한 예약의 attendee 데이터 조회 가능
create policy "Users can view reservations they attend"
  on reservation_attendees for select
  using (
    reservation_id in (
      select id from meeting_reservations
      where company_id in (select company_id from company_members where user_id = auth.uid())
    )
  );

-- 정책: AI 요약은 회의록을 통해 간접 접근
create policy "Users can view summaries of their company's minutes"
  on ai_summaries for select
  using (
    minute_id in (
      select id from meeting_minutes
      where company_id in (select company_id from company_members where user_id = auth.uid())
    )
  );

-- 정책: 알림은 본인 것만
create policy "Users can view their own notifications"
  on notifications for select
  using (user_id = auth.uid());

-- 정책: users 테이블은 기본 정보만, 자신 또는 같은 회사 멤버만 조회
create policy "Users can view own profile or same-company users"
  on users for select
  using (
    id = auth.uid()
    or id in (
      select user_id from company_members
      where company_id in (select company_id from company_members where user_id = auth.uid())
    )
  );

-- 정책: companies 테이블은 자신이 속한 회사만 조회
create policy "Users can view their own companies"
  on companies for select
  using (id in (select company_id from company_members where user_id = auth.uid()));
