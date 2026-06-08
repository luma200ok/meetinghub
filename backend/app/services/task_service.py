"""담당: 정재봉 — 업무 관리 (Action Item)

업무는 이은석(AI) 파트가 action_items에 생성한 데이터를 다룬다.
여기서는 조회 / 수정 / 상태변경 / 담당자변경을 담당한다.
"""
from flask import g

from app.repositories.task_repository import ActionItemRepository

VALID_STATUSES = {'TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'}


class TaskService:
    def __init__(self):
        self.tasks = ActionItemRepository()

    def list(self, status: str | None = None, assignee_id: str | None = None) -> list[dict]:
        if status is not None:
            status = self._valid_status(status)
        return self.tasks.list_in_company(self._company_id(), status, assignee_id)

    def update(self, task_id: str, data: dict) -> dict:
        company_id = self._company_id()
        self._get_or_404(task_id, company_id)

        source = data or {}
        payload: dict = {}

        if 'task' in source:
            task = (source.get('task') or '').strip()
            if not task:
                raise ValueError('업무 내용은 비울 수 없습니다.')
            payload['task'] = task
        if 'due_date' in source:
            payload['due_date'] = source.get('due_date')
        if 'status' in source:
            payload['status'] = self._valid_status(source.get('status'))
        if 'assignee_id' in source:
            payload['assignee_id'] = source.get('assignee_id')

        if not payload:
            raise ValueError('수정할 내용이 없습니다.')
        return self.tasks.update_in_company(task_id, company_id, payload)

    def update_status(self, task_id: str, status: str) -> dict:
        company_id = self._company_id()
        self._get_or_404(task_id, company_id)
        return self.tasks.update_in_company(task_id, company_id, {'status': self._valid_status(status)})

    def update_assignee(self, task_id: str, assignee_id: str) -> dict:
        company_id = self._company_id()
        self._get_or_404(task_id, company_id)
        if not assignee_id:
            raise ValueError('담당자 ID는 필수입니다.')
        return self.tasks.update_in_company(task_id, company_id, {'assignee_id': assignee_id})

    # ---- helpers ----
    def _get_or_404(self, task_id: str, company_id: str) -> dict:
        task = self.tasks.find_in_company(task_id, company_id)
        if task is None:
            raise LookupError('업무를 찾을 수 없습니다.')
        return task

    def _valid_status(self, status: str) -> str:
        if status not in VALID_STATUSES:
            raise ValueError(f'잘못된 상태값입니다: {status} (가능: {", ".join(sorted(VALID_STATUSES))})')
        return status

    def _company_id(self) -> str:
        company_id = getattr(g, 'company_id', None)
        if not company_id:
            raise ValueError('X-Company-Id 헤더가 필요합니다.')
        return company_id
