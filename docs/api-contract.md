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

## 상태값
- **회의 예약**: `RESERVED` / `IN_PROGRESS` / `DONE` / `CANCELLED`
- **업무**: `TODO` / `IN_PROGRESS` / `DONE` / `BLOCKED`
- **알림 타입**: `MEETING_REMINDER` / `TASK_ASSIGNED` / `INVITE`

## 에러 응답 형식
```json
{ "error": "메시지" }
```

> DTO 스키마 상세는 `backend/app/models/schemas.py` 와 `frontend/src/types/index.ts` 참조.
