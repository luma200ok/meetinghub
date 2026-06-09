# MeetingHub — 진행 현황

> 매 PR 머지 직후 갱신하는 팀 진행현황 단일 소스. 작업 시작 전 본 문서로 컨텍스트 파악.
> 상세 보고서는 [report.md](report.md), API 명세는 [api-contract.md](api-contract.md) 참조.

**마지막 갱신:** 2026-06-09
**레포:** [luma200ok/meetinghub](https://github.com/luma200ok/meetinghub) (Public)

---

## 인프라
| 영역 | 상태 |
|------|------|
| 프론트 (Next.js) | Netlify(`meeting-hub-ai`) — `netlify.toml`에 공개 `NEXT_PUBLIC_*`(Supabase URL/키, API URL) 고정(#25). `npm run build` PASS |
| 백엔드 (Flask) | Render(`meetinghub-api`) — `render.yaml`에 SUPABASE_URL·CORS 고정, 시크릿 3개만 대시보드. Python 3.11.9 고정(#23). pytest PASS |
| DB / Auth | Supabase Cloud `toptwnqbqrqefhlbeelb` (ap-southeast-1) — 전 테이블 RLS 활성화 |
| AI | OpenAI GPT-4o |

---

## 구현 현황 (팀원별)
| 영역 | 담당 | 상태 |
|------|------|:----:|
| 공통 인프라 (헬스체크·에러핸들러·인증 미들웨어) | 공통 | ✅ 완료 |
| 인증·기업·조직 관리 (기업/초대/조직도/부서/직급) | 김관영 | ✅ 완료 |
| 업무 관리·통합 검색·대시보드·통계 | 정재봉 | ✅ 완료 |
| 알림 (목록·읽음·5분 전 자동 알림) | 송유미 | ✅ 완료 |
| 회의록 작성·조회·상세 | 허남 | ✅ 완료 (#8) |
| 회의실 예약·중복 검증 | 김승현 | ✅ 완료 (#13, 308 연동버그 #17로 해소) |
| 디자인 레퍼런스 (Stitch 화면 14 + 디자인시스템) | 공통 | ✅ 완료 |
| 인증 UI·소셜 로그인·회원가입/온보딩 흐름 | 이은석 | ✅ 머지 (#7) |
| AI 분석·Action Item 생성 | 이은석 | ⏳ 미구현 — OpenAI 키만 발급 (백엔드 `ai_service` 스텁 / 회의록 상세 목업) |

> ✅ 완료 = main 머지 / 🔄 = PR 진행 중 / ⏳ = 대기
> **핵심 기능 전부 머지 완료. 남은 건 AI 실구현 1건.**

---

## 마지막 머지 PR
- 최신: **#22** Render 배포용 Python 3.11.9 고정 (`de363a6`, #23 종료)
- 직전: #7 로그인/회원가입+소셜 / #17 회의실·예약 308 픽스 / #13 회의실 예약 / #8 회의록

## 열린 PR
| PR | 제목 | 담당 | 상태 |
|----|------|------|------|
| #25 | 배포 환경변수 연동(netlify.toml/render.yaml 공개값 고정) | 메타 | 🔄 진행 |
| #21 | NEXT_PUBLIC_API_URL 미설정 시 프로덕션 빌드 실패 가드 | 이은석 | 🔄 (#25와 함께 머지 예정) |
| #19 | Feature/namheo minutes | 허남 | 🔄 |

---

## 다음 작업 후보
### P0 (블로커)
- [ ] **AI 실구현** (이은석) — 제품 핵심. `ai_service.py` 스텁 → 회의록(#8) 본문 → OpenAI 호출 → `ai_summaries`/`action_items` 저장 + 회의록 상세 목업을 실 API 연동. (인증/UI 흐름은 #7로 머지 완료)
### P1 (우선)
- [ ] end-to-end 통합 점검 (#6) — 가입→기업→예약→회의록→AI→Action Item→업무/대시보드 1회 검증
- [ ] 프론트 lint 8 errors 정리 (`react-hooks/set-state-in-effect` — meeting-rooms/minutes/notifications/reservations/tasks/NotificationBell)
### P2 (후속)
- [ ] 알림 5분 전 스케줄러 운영 검증 + 테스트 (#12)
- [ ] report.md §6 팀원 회고 작성
- [ ] `endpoints.ts` 데드 상수 정리 (`AUTH_LOGIN`·`ATTENDEES` 미사용)

---

## 알려진 이슈
| ID | 영역 | 내용 | 상태 |
|----|------|------|------|
| AI | 백엔드 | `ai_service.py` 미구현(스텁), 회의록 상세 목업 — OpenAI 키만 발급 | 대기 |
| 소셜 | 인증 | Google/Kakao OAuth: Supabase Provider 설정 + redirect(`/auth/callback`) + 브라우저 플로우 **수동 검증 필요** | 미검증 |
| #6 | 통합 | 업무·검색·대시보드 다듬기 + 통합 점검 미완 | 대기 |
| #12 | 알림 | 스케줄러 운영 검증·테스트 미완 | 대기 |
| lint | 프론트 | `set-state-in-effect` 8건 (빌드는 통과) | 대기 |
| report.md | 문서 | §6 회고 미작성 | 대기 |
| ~~#13~~ | ~~회의실 예약~~ | ~~308 연동버그~~ | ✅ #17로 해소 |
