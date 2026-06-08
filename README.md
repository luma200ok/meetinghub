# MeetingHub AI

AI 기반 기업 회의 및 협업 관리 B2B SaaS (멀티테넌트).

## 구조 (모노레포)

```
meetinghub/
├── frontend/          # Next.js + Supabase (Netlify 배포)
│   └── src/
│       ├── app/
│       │   ├── (auth)/         # 로그인 / 회원가입 / 초대수락
│       │   └── (dashboard)/    # 대시보드 / 조직도 / 회의실 / 예약 / 회의록 / 업무 / 알림 / 검색
│       ├── components/         # 도메인별 UI
│       ├── lib/
│       │   ├── supabase/       # 클라이언트/서버 SDK
│       │   └── api/            # 백엔드 API 클라이언트
│       └── types/              # 공유 타입
│
├── backend/           # Flask + Supabase + OpenAI (Render 배포)
│   ├── main.py
│   ├── app/
│   │   ├── routes/            # 도메인별 Blueprint
│   │   ├── services/          # 비즈니스 로직
│   │   ├── repositories/      # Supabase 데이터 접근
│   │   ├── models/            # Pydantic 스키마
│   │   ├── middleware/        # 인증 / 멀티테넌트
│   │   └── utils/             # supabase / openai / scheduler
│   └── db/schema.sql          # Supabase 테이블 정의
│
└── docs/api-contract.md       # 프론트↔백엔드 API 명세
```

## 기술 스택
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Supabase Auth, Google Stitch(디자인) → Netlify
- **Backend**: Flask, Supabase(PostgreSQL), OpenAI GPT, APScheduler → Render
- **DB/Auth**: Supabase

---

## 팀원 시작 가이드

### 1. 레포 클론
```bash
git clone https://github.com/Human2jo/meetinghub.git
cd meetinghub
```

### 2. Frontend 실행
```bash
cd frontend
npm ci
cp .env.example .env.local   # 아래 값 입력
npm run dev                  # http://localhost:3000
```

`.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=Supabase_프로젝트_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=Supabase_publishable_키
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> **값 위치**: [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트 → **Project Settings** → **API**
> - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
> - `publishable 키` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 3. Backend 실행
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # Supabase service / OpenAI 키 입력
python main.py                # http://localhost:5000
```

---

## 학습 가이드 📚

이 레포는 **뼈대만** 만들어져 있습니다. `services/`·`repositories/` 메서드 본문은 `NotImplementedError`, 프론트 `page.tsx`는 한 줄짜리 placeholder입니다. 각자 채우면서 학습합니다.

1. **모두 먼저 읽기** → [공통 가이드](docs/guides/00-common.md) (아키텍처·레이어·Supabase·멀티테넌트)
2. **본인 파트 가이드** → 담당 파일/구현 순서/체크포인트/힌트 정리됨

| 담당 | 영역 | 가이드 |
|------|------|--------|
| 김관영 | 기업·조직 관리 (기업 생성, 초대, 조직도, 부서, 직급) | [01-organization](docs/guides/01-organization.md) |
| 김승현 | 회의실 예약 (회의실/예약/참석자, 중복 검증) | [02-reservation](docs/guides/02-reservation.md) |
| 송유미 | 알림 (생성, 5분 전 알림, 알림 UI) | [03-notification](docs/guides/03-notification.md) |
| 허남 | 회의록 (작성, 조회, 회의 상세) | [04-minutes](docs/guides/04-minutes.md) |
| 이은석 | AI 기능 (GPT 연동, 요약, 결정사항, Action Item) | [05-ai](docs/guides/05-ai.md) |
| 정재봉 | 업무 관리, 검색, 대시보드, 통계 | [06-task-dashboard](docs/guides/06-task-dashboard.md) |

> 담당 영역은 `backend/app/routes/`·`services/` 상단 주석(`# 담당: 홍길동`)으로도 표시돼 있습니다.
> API 명세는 [docs/api-contract.md](docs/api-contract.md), DB 스키마는 [backend/db/schema.sql](backend/db/schema.sql) 참고.

## MVP 범위 (PRD §17)
회원가입 · 기업 생성 · 초대 기반 조직도 · 회의실 관리 · 회의 예약 · 참석자 관리 · 5분 전 알림 · 회의록 작성 · AI 요약 · AI Action Item · 업무 관리 · Dashboard

**제외**: 채팅, 쪽지, 음성 분석, 화상회의 연동, 모바일 앱

---

## 주의사항
- `.env`, `.env.local` 파일은 **절대 Git에 올리지 마세요.**
- Supabase / OpenAI 키는 팀 내부 채널로 공유받으세요.
