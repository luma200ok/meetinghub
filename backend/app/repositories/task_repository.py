from datetime import date

from app.models.task import ActionItem


class TaskRepository:
    def list_by_assignee(self, company_id: int, user_id: int) -> list[ActionItem]:
        return [
            ActionItem(1, company_id, "API 설계", "김승현", date(2026, 6, 15), "TODO", "AI Action Item"),
            ActionItem(2, company_id, "Dashboard 통계 카드 구성", "정재봉", date(2026, 6, 18), "IN_PROGRESS", "회의록"),
            ActionItem(3, company_id, "초대 메일 플로우 점검", "김관영", None, "BLOCKED", "조직관리"),
        ]
