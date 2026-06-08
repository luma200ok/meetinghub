# 허남 — 회의록

> 먼저 [공통 가이드](00-common.md)를 읽으세요.

## 담당 범위
회의록 작성 · 회의록 조회 · 회의 상세

## 담당 파일
| 파일 | 내용 |
|------|------|
| `backend/app/routes/minutes.py` | 회의록 CRUD |
| `backend/app/services/minute_service.py` | ← 구현 |
| `frontend/src/app/(dashboard)/minutes/` | 회의록 목록/상세 화면 |
| `frontend/src/app/(dashboard)/reservations/[id]/` | 회의 상세(회의록 진입점) |
| `frontend/src/components/minutes/` | 에디터 UI |

## 관련 테이블
`meeting_minutes` (그리고 조회 시 `meeting_reservations` join)

## 구현 순서
1. **회의록 작성** (`minute_service.create`)
   - `reservation_id`에 연결, `content`(웹 에디터 텍스트), `created_by` 저장
   - 한 회의에 회의록 1개 정책이면 중복 생성 방지
2. **회의록 조회** (`get`, `list`)
   - 단건: 회의 정보 + 작성자 함께
   - 목록: 회의 제목/날짜와 함께
3. **회의록 수정** (`update`)
   - 작성자 본인 또는 권한자만 수정 가능하게

## 회의 상세 화면
- 회의 정보(제목/시간/회의실/참석자) + 회의록 + (이은석 파트의) AI 분석 결과를 한 페이지에 표시
- AI 분석 트리거 버튼은 이은석 파트 API(`/api/ai/analyze`)를 호출

## 체크포인트
- [ ] 회의록이 올바른 회의(reservation)에 연결되는가?
- [ ] 본인 기업 회의의 회의록만 보이는가?
- [ ] 수정 권한이 통제되는가?
- [ ] 빈 내용 저장이 방지되는가?

## 힌트
- 에디터는 우선 `<textarea>`로 시작 → 나중에 리치 에디터로 확장
- AI 파트와의 연결점: 회의록 저장 후 `minute_id`를 AI `/analyze`에 전달
- join이 복잡하면 두 번 조회해서 합쳐도 됩니다 (학습 단계)
