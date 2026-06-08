# MeetingHub AI

Next.js + Supabase 프론트엔드와 Flask 백엔드 골격을 함께 둔 MeetingHub AI 통합 프로젝트입니다.

## 구조

```text
meetinghub/
├── src/                    # Next.js App Router frontend
├── src/lib/supabase/       # Supabase browser/server client
├── backend/                # Flask backend copied from MeetingHubAI
│   ├── main.py
│   ├── app/
│   ├── templates/
│   ├── static/
│   └── sql/schema.sql
└── supabase/schema.sql     # Supabase/PostgreSQL 적용 참고용 스키마
```

## 실행

### Frontend

```bash
npm ci
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```

또는 프로젝트 루트에서:

```bash
npm run dev:backend
```

백엔드는 `http://127.0.0.1:5000`에서 실행됩니다.

## 환경 변수

`.env.example`을 참고해 `.env.local` 또는 각 실행 환경의 env 파일을 구성합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SECRET_KEY=replace-me
DATABASE_URL=sqlite:///meetinghub.db
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

## MVP 범위

- 회원가입
- 기업 생성
- 초대 기반 조직도
- 회의실 관리
- 회의 예약 및 중복 검증
- 참석자 관리
- 회의 시작 5분 전 알림
- 회의록 작성
- AI 회의 요약
- AI Action Item 생성
- 업무 관리
- Dashboard
