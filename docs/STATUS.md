# MeetingHub — 진행 현황

> 매 PR 머지 직후 갱신하는 팀 진행현황 단일 소스. 작업 시작 전 본 문서로 컨텍스트 파악.
> 상세 보고서는 [report.md](report.md), API 명세는 [api-contract.md](api-contract.md) 참조.

**마지막 갱신:** 2026-06-10
**레포:** [luma200ok/meetinghub](https://github.com/luma200ok/meetinghub) (Public)

---

## 인프라
| 영역 | 상태 |
|------|------|
| 프론트 (Next.js) | Netlify(`meeting-hub-ai`) — `netlify.toml`에 공개 `NEXT_PUBLIC_*` 고정(#25), API URL=`meetinghub-ai.onrender.com`. `npm run build` PASS |
| 백엔드 (Flask) | Render(`meetinghub-ai`, `meetinghub-ai.onrender.com`) — `/health` 200 확인, Render→Supabase OK. Python 3.11.9(#23). pytest PASS. ⚠️ 대시보드 `CORS_ORIGINS`에 Netlify 출처 추가 필요 |
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
| 테넌트 격리(IDOR) — 회의록/조직도 멤버십 검증 | 김관영 | ✅ 완료 (#49) + RLS defense-in-depth (#50) |
| AI 분석·Action Item 생성 | 이은석 | 🔄 PR #52 리뷰 중 — ⚠️ IDOR(헤더 신뢰)+빌드에러 발견, 수정 필요 |

> ✅ 완료 = main 머지 / 🔄 = PR 진행 중 / ⏳ = 대기
> **핵심 기능 머지 완료. AI(#37/#52)가 마지막 P0 — 현재 리뷰에서 블로커 수정 중.**

---

## 마지막 머지 PR (2026-06-09~10)
- **#51** 업무 수동 생성(Closes #45) / **#50** RLS defense-in-depth + tenant_guard 표준화(RLS 재귀 수정 포함) / **#49** 회의록·조직도 IDOR 차단(Closes #29,#30)
- **#48** 중복 예약 네비 제거(Closes #38) / **#43** 알림 후속(Closes #12) / **#42** 업무·대시보드 P2/P3 / **#41** 회의실 생성 재추가 / **#39** 조직도 IDOR prod-fix

## 열린 PR (리뷰 중)
| PR | 제목 | 담당 | 상태 |
|----|------|------|------|
| #52 | AI 분석·Action Item 구현 + 회의록 FE 연결 (#37) | 이은석 | 🔴 블로커 — IDOR(헤더 신뢰)·tsc 빌드에러·백엔드 테스트 0건 |
| #54 | meeting-rooms 레이아웃 + 예약 상세 | 김승현 | 🔄 리뷰 중 (백엔드 minute_service 변경 포함) |
| #53 | 중첩 `<main>` 제거 (Closes #6) | 정재봉 | 🔄 리뷰 중 (Trivial) |

## 이슈 배정 현황 (송유미·허남 부재 반영)
| 담당 | 진행 | 완료 |
|------|------|------|
| 이은석(EunSeok-222) | #37(AI, #52 리뷰), #47(hydration+토큰) | #7 |
| 김관영(Ketose333) | #31(RLS 하드닝 — #50로 정책 추가됨, 종료 검토) | #49(#29·#30), #43(#12) |
| 김승현(HyunDove) | #44(회의록 작성), #46(회의록 상세), #15(예약 P2), #54 | #48(#38) |
| 정재봉(luma200ok) | #6(#53로 마무리 중) | #51(#45) |

---

## 다음 작업 후보
### P0 (블로커)
- [ ] **AI 실구현 머지** (이은석/#52) — IDOR(require_member_company 누락) + tsc 빌드에러(MinuteViewer) + 백엔드 테스트 0건 **수정 후** 머지. ai_service/action_item_service가 헤더(g.company_id)만 신뢰 → #49 패턴(require_member_company) 적용 필요.
### P1 (우선)
- [ ] #6 통합점검 마무리 (#53 머지 시 중첩 main 해소)
- [ ] #47 대시보드 hydration(#418) + 토큰 리프레시 (이은석)
- [ ] 프론트 lint `set-state-in-effect` 정리
### P2 (후속)
- [ ] #31 RLS — #50로 정책+재귀수정 반영됨, 회귀 테스트 후 종료 (김관영)
- [ ] report.md §6 팀원 회고 작성
- [ ] `endpoints.ts` 데드 상수 정리

---

## 알려진 이슈
| ID | 영역 | 내용 | 상태 |
|----|------|------|------|
| #52 | 보안 | AI/Action-Item 서비스가 X-Company-Id 헤더만 신뢰 → cross-tenant IDOR (#49 패턴 미적용) | 🔴 리뷰서 발견, 머지 전 수정 |
| #52 | 빌드 | `MinuteViewer.tsx` `new Date(updated_at)` — types optional화로 tsc 실패 | 🔴 머지 전 수정 |
| 소셜 | 인증 | Google/Kakao OAuth: Supabase Provider 설정 + redirect + 브라우저 플로우 **수동 검증 필요** | 미검증 |
| lint | 프론트 | `set-state-in-effect` 8건 (빌드는 통과) | 대기 |
| report.md | 문서 | §6 회고 미작성 | 대기 |
| ~~#12 알림~~ | ~~스케줄러+테스트~~ | | ✅ #43 |
| ~~#29/#30 IDOR~~ | ~~회의록·조직도 PII~~ | | ✅ #49 (+ #50 RLS) |
| ~~#38 예약네비~~ | ~~중복 스텁~~ | | ✅ #48 |
| ~~#45 업무생성~~ | ~~수동 생성 진입점~~ | | ✅ #51 |
