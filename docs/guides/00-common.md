# 공통 학습 가이드

모든 파트가 시작 전에 읽어주세요. 아키텍처와 작업 흐름을 먼저 이해한 뒤 각자 파트 가이드로 넘어갑니다.

## 1. 전체 흐름 (요청 → 응답)

```
프론트(page.tsx)
  → lib/api/client.ts (fetch)
    → 백엔드 routes/*.py (Blueprint, @require_auth)
      → services/*.py (비즈니스 로직)   ← 여기를 채웁니다
        → repositories/*.py (Supabase 접근) ← 여기를 채웁니다
          → Supabase (PostgreSQL)
```

레이어를 건너뛰지 마세요. **컨트롤러(route)는 검증·호출만, 서비스는 로직, 레포는 DB 접근**입니다.

## 2. 레이어별 책임

| 레이어 | 파일 | 할 일 | 하지 말 것 |
|--------|------|-------|-----------|
| Route | `app/routes/*.py` | 요청 파싱, 서비스 호출, 상태코드 반환 | DB 직접 접근, 비즈니스 로직 |
| Service | `app/services/*.py` | 검증, 도메인 규칙, 레포 조합 | `request` 직접 참조, SQL |
| Repository | `app/repositories/*.py` | Supabase CRUD | 비즈니스 판단 |
| Model | `app/models/schemas.py` | Pydantic 요청/응답 스키마 | 로직 |

## 3. 멀티테넌트 (중요)

이 서비스는 **기업별 데이터 격리**가 핵심입니다. 다른 기업 데이터가 절대 보이면 안 됩니다.

- 모든 보호 API는 `Authorization: Bearer <token>` + `X-Company-Id: <id>` 헤더 필요
- `middleware/auth.py`가 토큰을 검증하고 `g.user`, `g.company_id`에 담아줍니다
- 조회/생성 시 **항상 `company_id`로 필터링/주입**하세요 (가장 흔한 실수)

## 4. Supabase 사용법

```python
from app.utils.supabase import get_supabase

sb = get_supabase()

# 조회
rows = sb.table('meeting_rooms').select('*').eq('company_id', company_id).execute()
print(rows.data)  # list[dict]

# 생성
created = sb.table('meeting_rooms').insert({'name': '회의실A', 'company_id': company_id}).execute()

# 수정
sb.table('meeting_rooms').update({'name': '회의실B'}).eq('id', room_id).execute()

# 삭제
sb.table('meeting_rooms').delete().eq('id', room_id).execute()
```

테이블 구조는 [`backend/db/schema.sql`](../../backend/db/schema.sql) 참고.

## 5. 작업 순서 (권장)

1. `db/schema.sql`을 Supabase SQL Editor에서 실행해 테이블 생성
2. 담당 `repositories/`에 레포 클래스 작성 (`BaseRepository` 상속)
3. 담당 `services/`의 `NotImplementedError`를 하나씩 구현
4. `models/schemas.py`에 요청/응답 스키마 추가
5. 로컬 실행 후 API 테스트 (`curl` 또는 프론트 연결)
6. 프론트 `page.tsx` 화면 구현

## 6. 로컬 실행

```bash
# 백엔드
cd backend && source .venv/bin/activate && python main.py   # :5000

# 프론트
cd frontend && npm run dev                                   # :3000
```

## 7. API 테스트 예시

```bash
curl -X GET http://localhost:5000/api/meeting-rooms \
  -H "Authorization: Bearer <supabase_jwt>" \
  -H "X-Company-Id: <company_uuid>"
```

## 8. 자주 하는 실수
- `company_id` 필터 누락 → 다른 기업 데이터 노출
- route에서 DB 직접 호출 → 레이어 붕괴
- 상태값을 문자열로 아무거나 → enum(`TODO`/`RESERVED` 등) 고정값만 사용
- 에러 시 상태코드 안 맞춤 → 생성은 201, 조회 200, 삭제 204, 인증실패 401

---
다음: 본인 파트 가이드를 읽으세요.
| [김관영](01-organization.md) · [김승현](02-reservation.md) · [송유미](03-notification.md) · [허남](04-minutes.md) · [이은석](05-ai.md) · [정재봉](06-task-dashboard.md) |
