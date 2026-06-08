# 송유미 — 알림

> 먼저 [공통 가이드](00-common.md)를 읽으세요.

## 담당 범위
알림 생성 · **회의 시작 5분 전 알림** · 알림 UI

## 담당 파일
| 파일 | 내용 |
|------|------|
| `backend/app/routes/notifications.py` | 알림 목록/읽음 |
| `backend/app/services/notification_service.py` | ← 구현 |
| `backend/app/utils/scheduler.py` | 5분 전 알림 스케줄러 (로직 일부 완성됨) |
| `frontend/src/app/(dashboard)/notifications/` | 알림 화면 |
| `frontend/src/components/notifications/` | 알림 벨/드롭다운 UI |

## 관련 테이블
`notifications`

## 알림 타입
`MEETING_REMINDER`(회의 임박) · `TASK_ASSIGNED`(업무 배정) · `INVITE`(초대)

## 구현 순서
1. **알림 목록** (`notification_service.list`)
   - 현재 사용자(`g.user`)의 알림을 최신순 조회
2. **읽음 처리** (`mark_read`, `mark_all_read`)
   - `is_read=true`로 업데이트
3. **5분 전 알림** (`scheduler.py`)
   - 이미 1분마다 도는 스케줄러와 발송 로직 틀이 있습니다
   - `create_app()`에서 `start_scheduler()`를 호출해 활성화하세요
   - 발송 대상/메시지 형식을 다듬고, 중복 발송 방지(이미 보낸 회의 표시)를 추가
4. **알림 UI** (프론트)
   - 헤더 벨 아이콘 + 안 읽은 개수 배지
   - 드롭다운 목록, 클릭 시 읽음 처리

## 스케줄러 활성화
`backend/app/__init__.py`의 `create_app()` 안에 추가:
```python
from app.utils.scheduler import start_scheduler
start_scheduler()  # 운영에선 워커 중복 실행 주의
```

## 체크포인트
- [ ] 본인 알림만 조회되는가? (다른 사용자 알림 격리)
- [ ] 5분 전 알림이 정확히 한 번만 가는가? (중복 방지)
- [ ] 읽음 처리 후 배지 숫자가 줄어드는가?

## 힌트
- 중복 발송 방지: 발송한 reservation_id를 기록하거나, notifications에 이미 같은 회의 알림이 있는지 확인
- 프론트는 폴링(주기적 fetch) 또는 Supabase Realtime 구독 둘 다 가능. 우선 폴링부터
- 실서버에서 gunicorn 워커가 여러 개면 스케줄러가 중복 실행됨 → 워커 1개 또는 별도 프로세스로 분리
