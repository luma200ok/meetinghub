"""담당: 정재봉 — 업무 관리 (Action Item)"""


class TaskService:
    def list(self) -> list[dict]:
        raise NotImplementedError

    def update(self, task_id: str, data: dict) -> dict:
        raise NotImplementedError

    def update_status(self, task_id: str, status: str) -> dict:
        # status: TODO / IN_PROGRESS / DONE / BLOCKED
        raise NotImplementedError

    def update_assignee(self, task_id: str, assignee_id: str) -> dict:
        raise NotImplementedError
