# MeetingHub

**부제**: 회의 준비부터 기록, 요약, action-item 관리까지 지원하는 AI 회의 도우미

- **팀원**: 2팀 | 김승현(PM), 허남(PL), 김관영, 송유미, 이은석, 정재봉
- **날짜**: 2026년 06월 09일

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
   - 프로젝트 개요 및 목표
   - 기대 효과 및 비즈니스 가치
   - 기술 스택
   - 팀원 역할
2. [프로젝트 설계](#2-프로젝트-설계)
   - 시스템 아키텍처 구성도
   - 백엔드 아키텍처 구성도
   - ERD
3. [기능 설명 및 시연](#3-기능-설명-및-시연)
4. [트러블 슈팅](#4-트러블-슈팅)
5. [향후 발전 방향](#5-향후-발전-방향)
6. [프로젝트 회고](#6-프로젝트-회고)

---

## 1. 프로젝트 개요

### 프로젝트 개요 및 목표

#### 배경

기업에서는 다양한 형태의 회의가 매일 진행되고 있지만, 회의 내용 정리 및 후속 업무 관리가 체계적으로 이루어지지 않는 경우가 많습니다.
특히 회의록 작성, 주요 의사결정 사항 정리, 액션 아이템 추적 등의 업무는 담당자에게 많은 시간과 비용을 요구하며, 누락으로 인한 커뮤니케이션 문제도 자주 발생합니다.
또한 최근 생성형 AI 기술의 발전으로 단순 기록을 넘어 회의 내용을 분석하고, 핵심 내용을 요약하며, 업무 수행을 지원하는 서비스에 대한 수요가 증가하고 있습니다.

이에 따라 **MeetingHub**는 B2B SaaS 기반의 AI 회의 협업 플랫폼으로서 회의 준비, 진행, 회의록 작성, 후속 업무 관리까지 하나의 서비스에서 제공하여 기업의 생산성과 협업 효율을 향상시키는 것을 목표로 개발되었습니다.

#### 목표

| # | 목표 | 설명 |
|---|------|------|
| 1 | **AI 기반 회의록 자동 생성** | 회의 내용을 자동으로 정리하여 문서 작성 시간을 단축 |
| 2 | **핵심 내용 및 의사결정 사항 요약** | 긴 회의 내용을 핵심 중심으로 요약 제공 |
| 3 | **액션 아이템(Task) 자동 추출** | 회의 후 담당자 및 업무를 자동 식별하여 후속 업무 관리 지원 |
| 4 | **기업 단위 협업 환경 제공** | B2B SaaS 구조를 통한 조직별 회의 데이터 관리 |
| 5 | **회의 데이터 통합 관리** | 회의 기록, 문서, 요약본을 중앙화하여 검색 및 재사용 가능 |
| 6 | **AI 기반 업무 생산성 향상** | 회의 준비부터 결과 정리까지 AI를 활용하여 업무 효율 극대화 |

---

### 기대 효과 및 비즈니스 가치

- 회의록 작성 시간 **80% 이상 단축**
- 회의 결과 공유 및 전달 속도 향상
- 업무 누락 감소 및 책임자 명확화
- 조직 내 협업 효율 증대
- 기업 지식 자산의 체계적 축적
- 생성형 AI 기반 업무 혁신 경험 제공

---

### 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| **Frontend** | Next.js 16.2.7 (App Router), TypeScript, Tailwind CSS 4 | Netlify 배포 |
| **Backend** | Flask 3.1, Gunicorn, APScheduler | Render 배포 |
| **AI** | OpenAI GPT (gpt-4o) | 요약·결정사항·Action Item 추출 |
| **DB / Auth** | Supabase (PostgreSQL), Supabase Auth | RLS 전 테이블 활성화 |
| **디자인** | Google Stitch | 화면 디자인·프로토타입 |
| **인프라** | Netlify (FE), Render (BE), Supabase Cloud | — |

---

### 팀원 역할

| 이름 | 역할 | 담당 기능 |
|------|------|----------|
| 김승현 (PM) | 프로젝트 관리 | 회의실 예약 (회의실/예약/참석자, **중복 예약 검증**) |
| 허남 (PL) | 기술 리드 | 회의록 (작성, 조회, 회의 상세) |
| 김관영 | 백엔드/프론트 | 기업·조직 관리 (기업 생성, 초대, 조직도, 부서, 직급) |
| 송유미 | 백엔드/프론트 | 알림 (생성, **5분 전 자동 알림**, 알림 UI) |
| 이은석 | AI/백엔드 | AI 기능 (GPT 연동, 요약, 결정사항, **Action Item 자동 추출**) |
| 정재봉 | 백엔드/프론트 | 업무 관리, 통합 검색, 대시보드, 통계 |

---

## 2. 프로젝트 설계

### 시스템 아키텍처 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│                        사용자 (브라우저)                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────────┐
│              Frontend — Netlify                                  │
│         Next.js 16 (App Router) + TypeScript                    │
│         Tailwind CSS 4  │  Supabase Auth (JWT)                  │
│                         │                                        │
│   /login  /signup  /invite/[token]                              │
│   /dashboard  /meeting-rooms  /reservations/[id]                │
│   /minutes/[id]  /tasks  /search  /notifications                │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST API  (Authorization: Bearer JWT)
                          │           (X-Company-Id: UUID)
┌─────────────────────────▼───────────────────────────────────────┐
│              Backend — Render                                    │
│         Flask 3.1 + Gunicorn  +  APScheduler                   │
│                                                                  │
│   /api/auth  /api/companies  /api/meeting-rooms                 │
│   /api/reservations  /api/minutes  /api/ai                      │
│   /api/tasks  /api/dashboard  /api/search  /api/notifications   │
└──────────┬───────────────────────────────────┬──────────────────┘
           │ Supabase Python SDK               │ OpenAI API
┌──────────▼───────────────┐      ┌────────────▼─────────────────┐
│   Supabase Cloud         │      │   OpenAI GPT-4o              │
│   PostgreSQL + Auth      │      │   요약 / 결정사항 / Action Item │
│   RLS 전 테이블 활성화     │      └──────────────────────────────┘
└──────────────────────────┘
```

---

### 백엔드 아키텍처 구성도

```
HTTP Request
    │
    ▼
┌──────────────────────────────────────────┐
│  Middleware                               │
│  ├── require_auth   JWT 검증 → g.user     │
│  └── require_company  → g.company_id     │
└──────────────────┬───────────────────────┘
                   │
    ┌──────────────▼──────────────────────────────────────────────┐
    │  Routes (Blueprint)  ← 요청 파싱 / 서비스 호출 / 상태코드 반환  │
    │  auth · companies · organization · meeting_rooms            │
    │  reservations · minutes · ai · tasks · dashboard · search   │
    │  notifications                                              │
    └──────────────┬──────────────────────────────────────────────┘
                   │
    ┌──────────────▼──────────────────────────────────────────────┐
    │  Services  ← 검증 / 도메인 규칙 / 레포 조합                   │
    │  auth_service · company_service · organization_service      │
    │  meeting_room_service · reservation_service                 │
    │  minute_service · ai_service                                │
    │  task_service · dashboard_service · search_service          │
    │  notification_service                                       │
    └──────────────┬──────────────────────────────────────────────┘
                   │
    ┌──────────────▼──────────────────────────────────────────────┐
    │  Repositories  ← Supabase CRUD                              │
    │  UserRepository · InvitationRepository                     │
    │  CompanyRepository · CompanyMemberRepository                │
    │  DepartmentRepository · PositionRepository                  │
    │  OrganizationMemberRepository · ActionItemRepository        │
    └──────────────┬──────────────────────────────────────────────┘
                   │
    ┌──────────────▼──────────────────────────────────────────────┐
    │  Supabase (PostgreSQL)                                       │
    │  service_role 키 — RLS bypass / 멀티테넌트 company_id 격리   │
    └─────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────┐
    │  APScheduler (백그라운드)                                    │
    │  1분 주기 — 5분 후 시작 예약 조회 → notifications 생성        │
    └─────────────────────────────────────────────────────────────┘
```

---

### ERD

```
companies ──┬── departments (parent_id 자기참조, 계층 구조)
            ├── positions
            ├── company_members ──── users
            ├── invitations
            ├── meeting_rooms
            ├── meeting_reservations ─┬── reservation_attendees ── users
            │                        └── meeting_minutes ─┬── ai_summaries
            │                                             └── action_items
            └── (action_items.company_id 직접 FK)

users ──── notifications
```

**주요 테이블**

| 테이블 | 핵심 컬럼 | 설명 |
|--------|----------|------|
| `companies` | id, name | 기업 (멀티테넌트 루트) |
| `users` | id, email, name | Supabase auth.users 연동 |
| `departments` | company_id, name, parent_id | 부서 (계층 구조) |
| `positions` | company_id, name, level | 직급 |
| `company_members` | user_id, company_id, dept_id, position_id, role | ADMIN / MEMBER |
| `invitations` | company_id, email, token, accepted | 이메일 초대 |
| `meeting_rooms` | company_id, name, location, capacity | 회의실 |
| `meeting_reservations` | company_id, room_id, title, start_at, end_at, status | RESERVED → IN_PROGRESS → DONE / CANCELLED |
| `reservation_attendees` | reservation_id, user_id | 참석자 |
| `meeting_minutes` | company_id, reservation_id, content | 회의록 |
| `ai_summaries` | minute_id, summary, key_points, decisions, risks | AI 분석 결과 (JSONB) |
| `action_items` | company_id, minute_id, assignee_id, task, due_date, status | TODO → IN_PROGRESS → DONE / BLOCKED |
| `notifications` | user_id, type, message, is_read | MEETING_REMINDER / TASK_ASSIGNED / INVITE |

> **멀티테넌트 격리**: `meeting_reservations`, `meeting_minutes`, `action_items` 테이블에 `company_id`를 비정규화하여 회사 단위 조회/통계/검색을 보장. RLS 전 테이블 활성화 후 백엔드 service_role 키만 접근 허용.

---

## 3. 기능 설명 및 시연

### 구현 현황 (2026-06-09 기준)

| 영역 | 담당 | 상태 | 비고 |
|------|------|:----:|------|
| 공통 인프라 (헬스체크·에러핸들러·인증 미들웨어) | 공통 | ✅ 완료 | main 머지 |
| 인증·기업·조직 관리 | 김관영 | ✅ 완료 | 초대 비밀번호 검증 보강 포함 |
| 업무 관리·통합 검색·대시보드 | 정재봉 | ✅ 완료 | 멀티테넌트 `company_id` 격리 도입 |
| 알림 (목록·읽음·5분 전 자동 알림) | 송유미 | ✅ 완료 | 프론트 P2 수정 후 머지 |
| 디자인 레퍼런스 (Stitch 화면 14 + 디자인시스템) | 공통 | ✅ 완료 | `docs/design/stitch/` |
| 회의록 작성·조회 | 허남 | ✅ 완료 | `company_id` 저장 보완 포함, main 머지 (#8) |
| AI 분석·Action Item 생성 | 이은석 | 🔄 작업 중 | PR #7 작성 중 — 회의록 연동·GPT 분석 |
| 회의실 예약·중복 검증 | 김승현 | 🔄 수정 중 | PR #13 — 중복 예약 검증 결함 발견, 수정 중 |

> ✅ 완료 = main 머지 / 🔄 작업·수정 중 = PR 진행 / ⏳ 예정 = 대기

---

### 3-1. 인증 (김관영)

| 기능 | 설명 |
|------|------|
| 회원가입 | 이메일/비밀번호로 계정 생성, Supabase Auth + `users` 테이블 연동 |
| 로그인 | Supabase Auth JWT 발급, 프론트에서 세션 유지 |
| 기업 생성 | 회원가입 후 기업 생성 시 생성자 자동 ADMIN 지정 |
| 직원 초대 | 이메일로 초대 링크 발송, 토큰 기반 초대 수락 |

**화면**: 로그인 → 회원가입 → 이메일 인증 → 기업 온보딩

---

### 3-2. 기업·조직 관리 (김관영)

| 기능 | 설명 |
|------|------|
| 부서 관리 | 계층 구조 부서 생성/수정/삭제 (parent_id 자기참조) |
| 직급 관리 | 회사별 직급 생성/조회 |
| 직원 목록 | 소속 부서·직급 포함 조회, 역할(ADMIN/MEMBER) 관리 |

---

### 3-3. 회의실 예약 (김승현)

| 기능 | 설명 |
|------|------|
| 회의실 CRUD | 회의실 등록/수정/삭제/조회 (위치, 수용 인원) |
| 예약 생성 | **중복 예약 검증**: 같은 회의실·겹치는 시간 `RESERVED`/`IN_PROGRESS` 예약 시 거절 |
| 참석자 관리 | 예약에 팀원 추가 |
| 예약 상태 전이 | `RESERVED` → `IN_PROGRESS` → `DONE` / `CANCELLED` |

**핵심 로직 — 중복 예약 검증**
```python
# 같은 room_id에서 시간대가 겹치는 활성 예약 조회
overlap = sb.table('meeting_reservations')
    .select('id')
    .eq('room_id', room_id)
    .in_('status', ['RESERVED', 'IN_PROGRESS'])
    .lt('start_at', end_at)
    .gt('end_at', start_at)
    .execute()
if overlap.data:
    raise ApiError(409, "해당 시간대는 이미 예약되어 있습니다")
```

---

### 3-4. 알림 (송유미)

| 기능 | 설명 |
|------|------|
| 알림 목록 조회 | 사용자별 알림 최신순 조회 |
| 읽음 처리 | 단건/전체 읽음 처리 (`is_read = true`) |
| **5분 전 자동 알림** | APScheduler 1분 주기 실행 — 5분 후 시작 예약 참석자에게 `MEETING_REMINDER` 알림 생성 |
| 업무 배정 알림 | Action Item 생성 시 담당자에게 `TASK_ASSIGNED` 알림 |

---

### 3-5. 회의록 (허남)

| 기능 | 설명 |
|------|------|
| 회의록 작성 | 예약에 연결된 자유 텍스트 에디터 기반 회의록 작성 |
| 회의록 조회 | 단건 (회의 정보 + 작성자 포함) / 목록 (회의 제목·날짜 포함) |
| 회의록 수정 | 내용 업데이트 |
| 회의 상세 | 예약 상세에서 회의록·AI 분석 결과 진입 |

---

### 3-6. AI 기능 (이은석)

| 기능 | 설명 |
|------|------|
| **회의록 AI 분석** | 회의록 content → GPT-4o → 요약 / 핵심 논의 / 결정사항 / 위험요소 추출 → `ai_summaries` 저장 |
| **Action Item 자동 생성** | 회의록 → GPT → `[{담당자, 업무, 마감일}]` 추출 → `action_items` 일괄 저장 |
| AI 분석 조회 | 회의록 상세에서 분석 결과 표시 |

**GPT 프롬프트 구조 예시**
```
회의록 내용을 분석하여 다음 항목을 JSON으로 반환하세요:
- summary: 회의 전체 요약 (3문장 이내)
- key_points: 핵심 논의사항 목록
- decisions: 결정사항 목록
- risks: 위험요소 목록
```

---

### 3-7. 업무 관리 · 검색 · 대시보드 (정재봉)

| 기능 | 설명 |
|------|------|
| **업무 관리** | Action Item 목록 조회 (담당자/상태 필터), 상태 변경, 담당자 재배정 |
| **통합 검색** | `q` 파라미터로 예약·회의록·업무 전체 검색 |
| **대시보드** | 오늘의 회의, 내 업무, 최근 회의, 회의 통계 (총 건수, 이번 주), 업무 통계 (TODO/IN_PROGRESS/DONE/BLOCKED) |

**대시보드 응답 구조**
```json
{
  "today_meetings": [...],
  "my_tasks": [...],
  "recent_meetings": [...],
  "meeting_stats": { "total": 42, "this_week": 7 },
  "task_stats": { "todo": 5, "in_progress": 3, "done": 18, "blocked": 1 }
}
```

---

## 4. 트러블 슈팅

### 트러블슈팅 1 — Supabase SDK와 Pydantic 버전 충돌

**상황**

`supabase==2.31.0` 업그레이드 후 서버 기동 시 `ImportError` 발생. 회의실 예약 API 전체 불능.

**원인**

`supabase 2.31.0`은 내부적으로 `pydantic v2.11.x`의 특정 API를 사용하는데, 기존 `requirements.txt`에 고정된 `pydantic==2.7.x`와 충돌. Pydantic v2 마이너 버전 간 내부 API 변경으로 인한 호환성 문제였다.

```
# 오류 예시
pydantic.errors.PydanticImportError: `BaseModel` fields may not be used ...
```

**해결**

`pydantic[email]` 버전을 `2.11.9`로 상향 고정하여 Supabase SDK가 요구하는 버전과 일치시킴.

```txt
# requirements.txt 수정
pydantic[email]==2.11.9  # 2.7.x → 2.11.9 (supabase 2.31.0 호환)
```

**교훈**: 외부 SDK 업그레이드 시 의존 라이브러리 호환 매트릭스를 먼저 확인하고, `requirements.txt`에 상한·하한 버전 범위를 명시할 것.

---

### 트러블슈팅 2 — 멀티테넌트 격리 누락으로 타 기업 데이터 노출

**상황**

대시보드·검색·업무 목록 API에서 다른 기업의 회의 예약, 회의록, Action Item이 함께 조회됨.

**원인**

`meeting_reservations`, `meeting_minutes`, `action_items` 테이블에 `company_id` 컬럼이 있음에도 일부 파트에서 INSERT 시 `company_id`를 생략하거나, SELECT 쿼리에서 `company_id` 필터를 누락함.

```python
# 문제 코드 — company_id 필터 누락
rows = sb.table('action_items').select('*').execute()

# 수정 코드
rows = sb.table('action_items').select('*').eq('company_id', g.company_id).execute()
```

INSERT 시에도 동일하게 `company_id`를 누락하여 NULL로 저장된 레코드가 발생, 검색에서 모든 회사에 노출됨.

**해결**

1. `api-contract.md`에 멀티테넌트 격리 규칙을 명시하고 전 파트에 공유
2. 각 테이블의 `company_id` 출처를 문서화 (예약→회의실, 회의록→예약, Action Item→회의록)
3. `middleware/tenant.py`의 `require_company` 데코레이터를 모든 데이터 API에 일괄 적용
4. 기존 NULL `company_id` 레코드 정리

**교훈**: B2B SaaS에서 멀티테넌트 격리는 DB 스키마 설계 단계부터 `company_id` 필수 컬럼으로 강제하고, 공통 미들웨어에서 자동 주입되도록 설계해야 한다.

---

### 트러블슈팅 3 — 알림 프론트 토큰키 불일치 + API URL 하드코딩

**상황**

알림 페이지에서 알림이 조회되지 않고, 로컬에선 되던 호출이 배포 환경을 가정하면 깨지는 구조였다.

**원인**

1. **토큰키 불일치** — `notifications/page.tsx`가 `localStorage.getItem("access_token")`을 사용했으나, 다른 화면과 `NotificationBell`은 `meetinghubAccessToken`을 사용. 키가 달라 토큰을 읽지 못함.
2. **API URL 하드코딩** — `http://127.0.0.1:5000`을 코드에 직접 작성하여 배포 시 백엔드 주소 변경에 대응 불가.
3. **경로 불일치** — 라우트가 `get('/')`(→ `/api/notifications/`)인데 프론트 상수는 `/api/notifications`라 308 redirect 발생.

**해결**

```ts
// 공통 api 클라이언트 사용 (NEXT_PUBLIC_API_URL 기반)
import { api, authHeaders } from "@/lib/api/client";
await api.get(ENDPOINTS.NOTIFICATIONS, { headers: authHeaders(token) });
```
- 토큰키를 `meetinghubAccessToken`으로 통일
- 하드코딩 URL → 공통 `api` 클라이언트(`NEXT_PUBLIC_API_URL`)
- 라우트 `get('/')` → `get('')`로 경로 통일

**교훈**: 프론트엔드는 토큰키·API 호출을 공통 모듈로 강제하고, URL 하드코딩을 금지해야 환경 이동(로컬↔배포)에 안전하다.

---

### 트러블슈팅 4 — 공통 파일(`__init__.py`) 병합 충돌

**상황**

알림 기능과 조직관리 후속 작업이 동시에 `app/__init__.py`(앱 팩토리)를 수정하여 머지 시 충돌 발생.

**원인**

같은 영역을 두 작업이 독립적으로 변경:
- 조직관리 후속: 에러 핸들러(`ValueError`/`PermissionError` 등)를 `__init__`에서 제거하고 `errors.py`로 일원화
- 알림: 같은 위치에 `start_scheduler(app)` 추가

```
CONFLICT (content): Merge conflict in backend/app/__init__.py
```

**해결**

한쪽을 버리는 게 아니라 **두 변경 모두 보존**:
```python
register_blueprints(app)
register_error_handlers(app)  # 에러 핸들러는 errors.py로 일원화
start_scheduler(app)          # 5분 전 알림 스케줄러 활성화
return app
```

**교훈**: 앱 팩토리·공통 레이아웃·환경설정 등 **공통 파일은 충돌 단골 지점**이다. 작업 전 `main` 최신화, 공통 인프라 리팩터링은 조기에, 충돌 해결은 양쪽 의도를 모두 살리는 방향으로 처리한다.

---

## 5. 향후 발전 방향

| # | 기능 | 설명 |
|---|------|------|
| 1 | **실시간 음성 STT** | 회의 중 실시간 녹음 → 텍스트 자동 변환 → 회의록 자동 생성 |
| 2 | **Zoom / Google Meet 연동** | 화상회의 플랫폼과 연동, 참석자·녹화·채팅 자동 수집 |
| 3 | **Slack 연동** | 알림을 Slack 채널로 전송, 업무 배정 메시지 자동 발송 |
| 4 | **AI 업무 추천** | 유사 회의 이력 기반 Action Item 자동 추천 |
| 5 | **다국어 지원** | 영어·일본어 등 다국어 회의록 요약 지원 |

---

## 6. 프로젝트 회고

> 각 팀원이 작성 예정

### 김승현 (PM)

...

### 허남 (PL)

...

### 김관영

...

### 송유미

...

### 이은석

...

### 정재봉

...
