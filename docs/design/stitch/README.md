# Stitch 디자인 레퍼런스

Google Stitch에서 받은 **디자인 시안**입니다. **레퍼런스용**이며, 그대로 덮어쓰지 말고 기능 페이지에 디자인만 점진 적용하세요.

- 출처: Stitch 프로젝트 **"Remix of Smart AI Work Hub"** (ID `3829221727082257922`)
- 원본: https://stitch.withgoogle.com/projects/3829221727082257922
- 받은 날짜: 2026-06-09
- 디자인 시스템: **Nexus Intelligence** (Enterprise Blue, Inter, 8px radius)

## 파일 목록 (데스크탑 화면 14개 + 디자인시스템)

| # | 파일 | 화면 | PRD 매핑(담당) |
|---|------|------|------|
| 1 | `01-ai-meeting-minutes.{html,png}` | AI 회의 분석 및 회의록 | 회의록·AI (허남·이은석) |
| 2 | `02-task-dashboard.{html,png}` | 전체 업무 대시보드 | 업무·대시보드 (정재봉) |
| 3 | `03-room-reservation.{html,png}` | 회의실 예약 및 일정 관리 | 회의실·예약 (김승현) |
| 4 | `04-organization.{html,png}` | 조직 및 구성원 관리 | 조직 (김관영) |
| 5 | `05-signup.{html,png}` | 회원가입 - 이메일 시작 | 인증 UI (김승현) |
| 6 | `06-email-verify.{html,png}` | 이메일 인증 안내 | 인증 UI (김승현) |
| 7 | `07-landing.{html,png}` | 랜딩 페이지 | 공통 셸 (김승현) |
| 8 | `08-login.{html,png}` | 로그인 | 인증 UI (김승현) |
| 9 | `09-design-system.md` | Design System (디자인 토큰) | 공통 (김승현) |
| 10 | `10-reservation-detail.{html,png}` | 회의 예약 상세 설정 | 회의실·예약 (김승현) |
| 11 | `11-room-management.{html,png}` | 회의실 관리 (관리자용) | 회의실·예약 (김승현) |
| 12 | `12-org-chart-detail.{html,png}` | 부서 및 조직도 관리 (상세) | 조직 (김관영) |
| 13 | `13-company-onboarding.{html,png}` | 기업 생성 및 온보딩 | 조직 (김관영) |
| 14 | `14-my-workflow.{html,png}` | 내 업무 및 워크플로우 | 업무 (정재봉) |
| 15 | `15-statistics.{html,png}` | 통계 (관리자 전용) | 대시보드·통계 (정재봉) |

- `.html` = Stitch 생성 정적 코드 (Tailwind CDN 사용)
- `.png` = 화면 스크린샷(미리보기)

## 제외된 항목 (랜딩 페이지 중복 — 받을 필요 없음)
원본에 모바일(390)로 3개 더 있지만, **html 내용이 `07-landing.html`과 100% 동일**(MD5 일치)한 랜딩 중복 프로토타입이라 제외. 새로운 화면이 아니므로 추가 다운로드 불필요.

| 스크린 ID | 제목 | 비고 |
|-----------|------|------|
| `5d92e680c9f04afe91abb08b18d9cb52` | Untitled Prototype | 📱 모바일, `07-landing`과 동일 코드 |
| `5d779074377f4c6ab8bde9b98c674714` | Untitled Prototype | 📱 모바일, `07-landing`과 동일 코드 |
| `e3226411efe54b13b5c37fb1fc3bd5a3` | MeetingHub Workspace Flow | 📱 모바일, `07-landing`과 동일 코드 |

## 사용 원칙 (중요)
1. **덮어쓰기 금지** — 기능 연동된 기존 페이지(로그인 api·대시보드 fetch 등)는 유지
2. 김승현(공통 UI/레이아웃 담당)이 `09-design-system.md` 기준으로 **공통 컴포넌트·레이아웃** 구축
3. 각 기능 페이지는 위 시안을 참고해 **디자인만 점진 적용**
4. Stitch는 계속 업데이트될 수 있음 → 갱신 시 이 폴더 다시 받기

## 재다운로드 방법 (Stitch MCP)
```
get_screen(name="projects/3829221727082257922/screens/<screenId>")
→ 응답의 htmlCode.downloadUrl / screenshot.downloadUrl 을 curl -L 로 저장
list_screens(projectId="3829221727082257922")  # 전체 스크린 목록·제목 확인
```
