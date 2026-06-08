# 김승현 — 회의실 & 예약

> 먼저 [공통 가이드](00-common.md)를 읽으세요.

## 담당 범위
회의실 관리 · 예약 관리 · 참석자 관리 · **중복 예약 검증**

## 담당 파일
| 파일 | 내용 |
|------|------|
| `backend/app/routes/meeting_rooms.py` | 회의실 CRUD |
| `backend/app/routes/reservations.py` | 예약 CRUD / 참석자 |
| `backend/app/services/meeting_room_service.py` | ← 구현 |
| `backend/app/services/reservation_service.py` | ← 구현 |
| `frontend/src/app/(dashboard)/meeting-rooms/` | 회의실 화면 |
| `frontend/src/app/(dashboard)/reservations/` | 예약 목록/상세 화면 |

## 관련 테이블
`meeting_rooms`, `meeting_reservations`, `reservation_attendees`

## 예약 상태
`RESERVED`(예약) → `IN_PROGRESS`(진행중) → `DONE`(종료) / `CANCELLED`(취소)

## 구현 순서
1. **회의실 CRUD** (`meeting_room_service`)
   - 등록/수정/삭제/조회, `company_id` 격리
2. **예약 생성** (`reservation_service.create`) ← 가장 중요
   - **중복 검증**: 같은 `room_id`에서 시간대([start_at, end_at])가 겹치는 `RESERVED`/`IN_PROGRESS` 예약이 있으면 거절
3. **예약 조회/수정/취소**
   - 취소는 삭제가 아니라 `status='CANCELLED'`
4. **참석자 추가** (`add_attendees`)
   - `reservation_attendees`에 다건 insert

## 중복 검증 로직 (핵심)
두 시간대 `[s1,e1]`, `[s2,e2]`가 겹치는 조건:
```
s1 < e2  AND  s2 < e1
```
Supabase 쿼리로 같은 방의 기존 예약을 가져와 위 조건으로 충돌을 확인하세요.
```python
existing = (sb.table('meeting_reservations')
    .select('id, start_at, end_at')
    .eq('room_id', room_id)
    .in_('status', ['RESERVED', 'IN_PROGRESS'])
    .execute())
# new_start < row.end_at and row.start_at < new_end 이면 충돌
```

## 체크포인트
- [ ] 겹치는 시간 예약이 거절되는가? (경계값: 끝나는 시각 == 시작 시각은 허용)
- [ ] 취소가 soft(상태 변경)로 처리되는가?
- [ ] 다른 기업의 회의실로 예약이 안 되는가?
- [ ] 참석자 중복 추가가 방지되는가?

## 힌트
- 시간 비교는 timezone-aware(`timestamptz`)로 통일. 프론트는 ISO 문자열로 전송
- 충돌 검증은 서비스 레이어에서. route에 넣지 마세요
