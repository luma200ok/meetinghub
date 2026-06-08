# MeetingHub AI — API Contract

> 프론트(Next.js)와 백엔드(Flask)가 공유하는 API 단일 진실. Base URL: `NEXT_PUBLIC_API_URL`

## 인증
- Supabase Auth JWT 사용
- 모든 보호 엔드포인트: `Authorization: Bearer <token>` + `X-Company-Id: <company_id>` 헤더

## 엔드포인트

| 도메인 | 메서드 | 경로 | 담당 |
|--------|--------|------|------|
| 회원가입 | POST | `/api/auth/signup` | 김관영 |
| 초대 | POST | `/api/auth/invite` | 김관영 |
| 초대 수락 | POST | `/api/auth/invite/accept` | 김관영 |
| 기업 생성 | POST | `/api/companies` | 김관영 |
| 부서 CRUD | GET/POST/PUT/DELETE | `/api/departments` | 김관영 |
| 직급 | GET/POST | `/api/positions` | 김관영 |
| 직원 목록 | GET | `/api/members` | 김관영 |
| 회의실 CRUD | GET/POST/PUT/DELETE | `/api/meeting-rooms` | 김승현 |
| 회의 예약 | GET/POST/PUT/DELETE | `/api/reservations` | 김승현 |
| 참석자 추가 | POST | `/api/reservations/<id>/attendees` | 김승현 |
| 회의록 | GET/POST/PUT | `/api/minutes` | 허남 |
| AI 분석 | POST | `/api/ai/analyze` | 이은석 |
| AI Action Item | POST | `/api/ai/action-items` | 이은석 |
| 업무 관리 | GET/PUT/PATCH | `/api/tasks` | 정재봉 |
| 대시보드 | GET | `/api/dashboard` | 정재봉 |
| 검색 | GET | `/api/search?q=` | 정재봉 |
| 알림 | GET/PATCH | `/api/notifications` | 송유미 |

## ⚠️ 멀티테넌트 격리 — `company_id` 필수 (전 파트 공통)

`meeting_reservations` · `meeting_minutes` · `action_items` 테이블에 **`company_id` 컬럼**이 있습니다. (회사 단위 조회/통계/검색을 위해 비정규화)

**데이터를 생성(insert)하는 파트는 반드시 `company_id`를 함께 저장해야 합니다:**
| 테이블 | 담당 | `company_id` 출처 |
|--------|------|------------------|
| `meeting_reservations` | 김승현 | 예약하는 회의실(`meeting_rooms`)의 company_id |
| `meeting_minutes` | 허남 | 연결된 예약의 company_id |
| `action_items` | 이은석 | 회의록의 company_id |

> `company_id`를 안 넣으면 대시보드·검색·업무 목록에서 그 데이터가 안 보입니다(회사 격리에서 누락). insert 시 `g.company_id` 또는 부모 레코드의 company_id를 넣으세요.

## 상태값
- **회의 예약**: `RESERVED` / `IN_PROGRESS` / `DONE` / `CANCELLED`
- **업무**: `TODO` / `IN_PROGRESS` / `DONE` / `BLOCKED`
- **알림 타입**: `MEETING_REMINDER` / `TASK_ASSIGNED` / `INVITE`

## 업무·검색·대시보드 응답 (정재봉)
- `GET /api/tasks?status=&assignee_id=` → `[{id, task, status, due_date, assignee:{email,name}}]`
- `PATCH /api/tasks/<id>/status` body `{status}`, `PATCH /api/tasks/<id>/assignee` body `{assignee_id}`
- `GET /api/dashboard` → `{today_meetings, my_tasks, recent_meetings, meeting_stats:{total,this_week}, task_stats:{todo,in_progress,done,blocked}}`
- `GET /api/search?q=` → `{reservations:[], minutes:[], tasks:[]}`

## 에러 응답 형식
```json
{ "error": "메시지" }
```

> DTO 스키마 상세는 `backend/app/models/schemas.py` 와 `frontend/src/types/index.ts` 참조.
