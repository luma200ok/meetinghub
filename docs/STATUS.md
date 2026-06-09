# MeetingHub — 진행 현황

> 매 PR 머지 직후 갱신하는 팀 진행현황 단일 소스. 작업 시작 전 본 문서로 컨텍스트 파악.
> 상세 보고서는 [report.md](report.md), API 명세는 [api-contract.md](api-contract.md) 참조.

**마지막 갱신:** 2026-06-09
**레포:** [luma200ok/meetinghub](https://github.com/luma200ok/meetinghub) (Public)

---

## 인프라
| 영역 | 상태 |
|------|------|
| 프론트 (Next.js) | Netlify — 배포 파이프라인 복구 (레포 Public 전환으로 기여자 제한 해소). `npm run build` PASS (14 라우트) |
| 백엔드 (Flask) | Render — `backend/render.yaml` 설정 완료. pytest 54/54 PASS |
| DB / Auth | Supabase Cloud (PostgreSQL) — 전 테이블 RLS 활성화 |
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
| AI 분석·Action Item 생성 | 이은석 | 🔄 작업 중 (PR #7) |

> ✅ 완료 = main 머지 / 🔄 = PR 진행 중 / ⏳ = 대기
> **6개 파트 중 5개 완료, AI(#7) 1개 진행 중.**

---

## 마지막 머지 PR
- 최신: **#17** 회의실·예약 308 리다이렉트 픽스 (`7e2485e`)
- 직전: #16 docs 진행현황 안정화 / #13 회의실 예약·중복검증 / #8 회의록 / #11 알림

## 열린 PR
| PR | 제목 | 담당 | 상태 |
|----|------|------|------|
| #7 | AI 기능 | 이은석 | 🟡 작성 중 (main과 **충돌** → rebase 필요) |

---

## 다음 작업 후보
### P0 (블로커)
- [ ] **#7 AI 기능 완성** (이은석) — 제품 핵심. main rebase로 충돌 해소 + 회의록(#8) 연동 + `/api/ai/*` 활성화
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
| #7 | AI | main과 머지 충돌 — rebase 필요 | 진행 중 |
| #6 | 통합 | 업무·검색·대시보드 다듬기 + 통합 점검 미완 | 대기 |
| #12 | 알림 | 스케줄러 운영 검증·테스트 미완 | 대기 |
| lint | 프론트 | `set-state-in-effect` 8건 (빌드는 통과) | 대기 |
| report.md | 문서 | §6 회고 미작성 | 대기 |
| ~~#13~~ | ~~회의실 예약~~ | ~~308 연동버그~~ | ✅ #17로 해소 |
