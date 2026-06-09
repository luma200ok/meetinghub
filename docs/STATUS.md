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
- **#58** getByReservation 401/403 인증오류 삼킴 버그(Closes #57) / **#55** 세로 사이드바 전환 + 중첩 `<main>` 해소(Closes #6) / **#54** meeting-rooms 레이아웃 + 회의록 모달 P2
- **#51** 업무 수동 생성(Closes #45) / **#50** RLS defense-in-depth + 재귀수정 / **#49** 회의록·조직도 IDOR 차단(Closes #29,#30) / **#48** 예약 네비 정리(Closes #38) / **#43** 알림 후속(Closes #12)

## 열린 PR
| PR | 제목 | 담당 | 상태 |
|----|------|------|------|
| #52 | AI 분석·Action Item 구현 + 회의록 FE 연결 (#37) | 이은석 | 🔴 changes-requested — P1 8건(IDOR 5·502버그·빌드·테스트0). 재작업 필요 |
| #56 | MinuteViewer 빌드 가드 (base=#52 브랜치) | 정재봉 | 🟡 #52 빌드만 푸는 서브 핫픽스 — #52 재작업 시 함께 처리 |

> #53(중첩 main)은 #55로 대체되어 CLOSED. #54는 메타가 P2 수정 후 머지 완료.

## 이슈 배정 현황 (송유미·허남 부재 반영)
| 담당 | 진행 | 완료 |
|------|------|------|
| 이은석(EunSeok-222) | #37(AI, #52 changes-requested), #47(hydration+토큰) | #7 |
| 김관영(Ketose333) | #31(RLS — #50로 정책+재귀수정 반영, 회귀테스트 후 종료) | #49(#29·#30), #43(#12) |
| 김승현(HyunDove) | #44(회의록 작성 진입점), #46(회의록 상세 더미제거), #15(예약 P2) | #54, #48(#38) |
| 정재봉(luma200ok) | (백로그 조율) | #51(#45), #58(#57), #6(#55) |

---

## 다음 작업 후보
### P0 (블로커)
- [ ] **AI 실구현 머지** (이은석/#52) — 재작업 필요: ① ai_service/action_item_service `_company_id()`를 `require_member_company()`로 교체(#49 패턴, IDOR 5건) ② `get_summary` 멤버십 가드 ③ `generate_action_items` 502버그(프롬프트/파싱 불일치) ④ MinuteViewer 빌드가드(#56) ⑤ 백엔드 테스트 추가
### P1 (우선)
- [ ] #44 회의록 작성 진입점 (김승현)
- [ ] #46 회의록 상세 더미데이터 제거 + 실데이터 (김승현) — minutes/[id] 이중 사이드바·목업 노출 버그 포함
- [ ] #47 대시보드 hydration(#418) + 토큰 리프레시 (이은석)
### P2 (후속)
- [ ] #31 RLS — #50로 정책+재귀수정 반영됨, 회귀 테스트 후 종료 (김관영)
- [ ] 프론트 lint `set-state-in-effect` 8건 정리 (빌드 무관 tech-debt)
- [ ] notification mark_read 없는 알림에 `{}`+200 반환 → 404 검토 (테스트 동반 변경)
- [ ] report.md §6 팀원 회고 작성

---

## 알려진 이슈
| ID | 영역 | 내용 | 상태 |
|----|------|------|------|
| #52 | 보안 | AI/Action-Item 서비스가 X-Company-Id 헤더만 신뢰 → cross-tenant IDOR 5건(#49 패턴 미적용) | 🔴 #52 재작업서 수정 |
| #52 | 동작 | `generate_action_items` 프롬프트/파싱 불일치로 항상 502 (자동생성 미동작) | 🔴 #52 재작업서 수정 |
| #52 | 빌드 | `MinuteViewer.tsx` `new Date(updated_at)` — types optional화로 tsc 실패 | 🟡 #56 가드로 해결안 있음 |
| minutes/[id] | 프론트 | 이중 사이드바 + 더미데이터(제임스 스미스 등) 노출 | #46에서 처리 |
| 소셜 | 인증 | Google/Kakao OAuth: Supabase Provider 설정 + redirect + 브라우저 플로우 **수동 검증 필요** | 미검증 |
| lint | 프론트 | `set-state-in-effect` 8건 (빌드는 통과) | 대기 |
| report.md | 문서 | §6 회고 미작성 | 대기 |
| ~~#12 알림~~ | ~~스케줄러+테스트~~ | | ✅ #43 |
| ~~#29/#30 IDOR~~ | ~~회의록·조직도 PII~~ | | ✅ #49 (+ #50 RLS) |
| ~~#38 예약네비~~ | ~~중복 스텁~~ | | ✅ #48 |
| ~~#45 업무생성~~ | ~~수동 생성 진입점~~ | | ✅ #51 |
