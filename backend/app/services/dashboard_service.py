from app.services.ai_service import AIService
from app.services.reservation_service import ReservationService
from app.services.task_service import TaskService


class DashboardService:
    def __init__(self):
        self.reservation_service = ReservationService()
        self.task_service = TaskService()
        self.ai_service = AIService()

    def get_overview(self, company_id: int, user_id: int) -> dict:
        reservations = self.reservation_service.list_reservations(company_id)
        tasks = self.task_service.list_my_tasks(company_id, user_id)
        minutes = self.ai_service.get_recent_minutes(company_id)
        return {
            "today_meetings": reservations[:2],
            "my_tasks": tasks,
            "recent_minutes": minutes,
            "meeting_count": len(reservations),
            "open_task_count": len([task for task in tasks if task.status != "DONE"]),
        }
