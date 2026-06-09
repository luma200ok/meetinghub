# MeetingHub — 진행 현황

> 매 PR 머지 직후 갱신하는 팀 진행현황 단일 소스. 작업 시작 전 본 문서로 컨텍스트 파악.
> 상세 보고서는 [report.md](report.md), API 명세는 [api-contract.md](api-contract.md) 참조.

**마지막 갱신:** 2026-06-10
**레포:** [luma200ok/meetinghub](https://github.com/luma200ok/meetinghub) (Public)

---

## 인프라
| 영역 | 상태 |
|------|------|
| 프론트 (Next.js) | **Vercel** `meetinghub-lime.vercel.app`(프로덕션) — 실기능 E2E 통과(가입→온보딩→기업생성→대시보드). Netlify(`meeting-hub-ai`)도 병행. ⚠️ Vercel **Preview** 환경엔 `NEXT_PUBLIC_*` 미설정이라 PR 프리뷰 배포 실패(프로덕션 무관, 선택적 보강) |
| 백엔드 (Flask) | Render(`meetinghub-ai.onrender.com`) — `/health` 200, Render→Supabase OK. Python 3.11.9(#23). pytest 82 PASS. ✅ `CORS_ORIGINS`에 Vercel 출처 추가됨(Render 대시보드 + render.yaml) — 2026-06-10 |
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
| AI 분석·Action Item 생성 | 이은석 | ✅ 완료 (#52) — 메타가 IDOR 5건·502버그 수정 후 머지 |

> ✅ 완료 = main 머지 / 🔄 = PR 진행 중 / ⏳ = 대기
> **모든 P0 핵심 기능 머지 완료(AI #37 포함). 남은 건 다른 팀원 P1/P2 마감뿐.**

---

## 마지막 머지 PR (2026-06-09~10)
- **#59** 다크모드 검정 바탕 제거(라이트 테마 일관성, color-scheme:light) — Vercel 프로덕션 반영 확인 / **#52** AI 분석·Action Item 구현 + 회의록 FE 연결(Closes #37,#46) — 메타가 IDOR 5건·502버그 수정 + 회귀테스트 4건 후 머지 / **#56** MinuteViewer 빌드 가드
- **#58** getByReservation 인증오류 삼킴(Closes #57) / **#55** 세로 사이드바 + 중첩 main 해소(Closes #6) / **#54** meeting-rooms 레이아웃
- **#51** 업무 생성(Closes #45) / **#50** RLS defense-in-depth+재귀수정 / **#49** 회의록·조직도 IDOR(Closes #29,#30) / **#48**(Closes #38) / **#43**(Closes #12)

## 열린 PR
- **(없음)** — 2026-06-10 기준 전부 머지

> AI(#52)까지 머지 완료 → 로그인 회사ID 버그·회의록 연결·AI 모두 main 반영.

## 이슈 배정 현황 (송유미·허남 부재 반영)
| 담당 | 진행 | 완료 |
|------|------|------|
| 이은석(EunSeok-222) | #47(hydration+토큰) | #7, #37(AI, #52) |
| 김관영(Ketose333) | #31(RLS — #50로 정책+재귀수정 반영, 회귀테스트 후 종료) | #49(#29·#30), #43(#12) |
| 김승현(HyunDove) | #44(회의록 작성 진입점), #15(예약 P2) | #54, #48(#38), #46(#52로) |
| 정재봉(luma200ok) | (백로그 조율) | #51(#45), #58(#57), #6(#55) |

---

## 다음 작업 후보 (P0 전부 머지 완료 — 남은 건 다른 팀원 P1/P2)
### P1 (우선)
- [ ] #44 회의록 작성 진입점 (김승현)
- [ ] #47 대시보드 hydration(#418) + 토큰 리프레시 (이은석)
### P2 (후속)
- [ ] #15 회의실 예약 P2 (TOCTOU/원자성) (김승현)
- [ ] #31 RLS — #50로 정책+재귀수정 반영됨, 회귀 테스트 후 종료 (김관영)
- [ ] AI 정상경로 단위테스트(#52는 IDOR 거부만 커버) + routes/ai.py minute_id KeyError 가드
- [ ] 프론트 lint `set-state-in-effect` 8건 정리 (빌드 무관 tech-debt)
- [ ] notification mark_read 없는 알림에 `{}`+200 반환 → 404 검토 (테스트 동반)
- [ ] report.md §6 팀원 회고 작성

---

## 알려진 이슈
| ID | 영역 | 내용 | 상태 |
|----|------|------|------|
| 소셜 | 인증 | Google/Kakao OAuth: Supabase Provider 설정 + redirect + 브라우저 플로우 **수동 검증 필요** | 미검증 |
| AI 런타임 | 백엔드 | #52 AI는 빌드·IDOR·502 검증 완료. OPENAI_API_KEY로 실제 호출 동작은 미검증(키 필요) | 수동 검증 권장 |
| lint | 프론트 | `set-state-in-effect` 8건 (빌드는 통과) | 대기 |
| report.md | 문서 | §6 회고 미작성 | 대기 |
| ~~#52 IDOR/502/빌드~~ | ~~AI 보안·동작~~ | | ✅ #52(메타 수정) |
| ~~#12 알림~~ | ~~스케줄러+테스트~~ | | ✅ #43 |
| ~~#29/#30 IDOR~~ | ~~회의록·조직도 PII~~ | | ✅ #49 (+ #50 RLS) |
| ~~#38 예약네비~~ | ~~중복 스텁~~ | | ✅ #48 |
| ~~#45 업무생성~~ | ~~수동 생성 진입점~~ | | ✅ #51 |
