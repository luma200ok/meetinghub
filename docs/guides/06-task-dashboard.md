# 정재봉 — 업무 · 검색 · 대시보드

> 먼저 [공통 가이드](00-common.md)를 읽으세요.

## 담당 범위
업무 관리 · 통합 검색 · 대시보드 · 통계

## 담당 파일
| 파일 | 내용 |
|------|------|
| `backend/app/routes/tasks.py` | 업무 관리 |
| `backend/app/routes/dashboard.py` | 대시보드 집계 |
| `backend/app/routes/search.py` | 통합 검색 |
| `backend/app/services/task_service.py` | ← 구현 |
| `backend/app/services/dashboard_service.py` | ← 구현 |
| `backend/app/services/search_service.py` | ← 구현 |
| `frontend/src/app/(dashboard)/tasks/` | 업무 보드 |
| `frontend/src/app/(dashboard)/dashboard/` | 대시보드 |
| `frontend/src/app/(dashboard)/search/` | 검색 |

## 관련 테이블
`action_items`(업무), 그리고 검색/통계는 `meeting_reservations`, `meeting_minutes` 등 전반

## 업무 상태
`TODO` → `IN_PROGRESS` → `DONE` / `BLOCKED`

## 구현 순서
1. **업무 관리** (`task_service`)
   - 목록 조회 (담당자/상태 필터)
   - 수정 / 상태 변경 / 담당자 변경 / 완료 처리
   - 업무는 이은석 파트(AI)가 `action_items`에 생성한 데이터를 다룸
2. **대시보드** (`dashboard_service.get_summary`)
   - 오늘 회의 / 내 업무 / 최근 회의 / 회의 통계 / 업무 통계 (PRD §13)
   - 여러 테이블 집계 → 하나의 응답 dict로
3. **통합 검색** (`search_service.search`)
   - `q`로 회의 / 회의록 / 업무 / 예약 동시 검색 (PRD §14)
   - 타입별로 묶어 반환

## 대시보드 응답 예시
```json
{
  "today_meetings": [...],
  "my_tasks": [...],
  "recent_meetings": [...],
  "meeting_stats": { "total": 12, "this_week": 4 },
  "task_stats": { "todo": 5, "in_progress": 2, "done": 8 }
}
```

## 체크포인트
- [ ] 상태 전이가 정해진 값(enum)만 허용되는가?
- [ ] 대시보드/검색이 `company_id`로 격리되는가?
- [ ] "내 업무"가 현재 사용자 기준인가?
- [ ] 검색이 부분 일치(ilike)로 동작하는가?

## 힌트
- 통계는 우선 여러 번 count 쿼리로 단순하게 → 나중에 최적화
- 검색은 Supabase `.ilike('title', f'%{q}%')` 로 시작
- 대시보드는 데이터가 많아질 수 있으니 각 목록에 limit 적용
- 업무 보드 UI는 상태별 컬럼(칸반)으로 시작하면 직관적
