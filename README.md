# meetinghub

Next.js + Supabase 기반 프로젝트입니다.

---

## 팀원 시작 가이드

### 1. 레포 클론

```bash
git clone https://github.com/Human2jo/meetinghub.git
cd meetinghub
```

---

### 2. 패키지 설치

```bash
npm ci
```

---

### 3. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 직접 만들어야 합니다.  
`.env.example`을 복사해서 시작하세요.

```bash
cp .env.example .env.local
```

그 다음 `.env.local` 파일을 열고 값을 채워넣으세요.

```env
NEXT_PUBLIC_SUPABASE_URL=여기에_Supabase_프로젝트_URL_입력
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=여기에_Supabase_anon_키_입력
```

> **값은 어디서 가져오나요?**  
> [Supabase 대시보드](https://supabase.com/dashboard) → 해당 프로젝트 선택 → 왼쪽 메뉴 **Project Settings** → **API** 탭  
> - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`에 입력  
> - `publishable 키 → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`에 입력

---

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 으로 접속하면 됩니다.

---

## 기술 스택

| 항목 | 사용 기술 |
|------|----------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 데이터베이스 | Supabase (PostgreSQL) |

---

## 주의사항

- `.env.local` 파일은 **절대 Git에 올리지 마세요.** (`.gitignore`에 등록되어 있습니다)
- Supabase 키는 팀 내부 채널을 통해 공유받으세요.
