from app.repositories.task_repository import TaskRepository


class TaskService:
    def __init__(self):
        self.task_repository = TaskRepository()

    def list_my_tasks(self, company_id: int, user_id: int):
        return self.task_repository.list_by_assignee(company_id, user_id)
