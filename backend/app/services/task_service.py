"""담당: 정재봉 — 업무 관리 (Action Item)

업무는 이은석(AI) 파트가 action_items에 생성한 데이터를 다룬다.
여기서는 조회 / 수정 / 상태변경 / 담당자변경을 담당한다.

인가 정책(P1-3):
- 조회: 같은 company 구성원이면 가능
- 수정/상태변경/담당자변경: 해당 업무의 담당자(assignee) 본인 또는 ADMIN만 가능
크로스테넌트 방어(P1-1/P1-2):
- 모든 경로에서 요청자가 company 구성원인지 검증 (require_member_company)
- 담당자 지정 시 대상 user가 같은 company 구성원인지 검증 (is_member)
"""
import uuid

from flask import g

from app.repositories.task_repository import ActionItemRepository
from app.services.tenant_guard import require_member_company, member_role, is_member

VALID_STATUSES = {'TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'}
MAX_LIMIT = 100


class TaskService:
    def __init__(self):
        self.tasks = ActionItemRepository()

    def list(
        self,
        status: str | None = None,
        assignee_id: str | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[dict]:
        if status is not None:
            status = self._valid_status(status)
        if assignee_id is not None:
            assignee_id = self._valid_uuid(assignee_id, 'assignee_id')
        self._validate_pagination(limit, offset)
        return self.tasks.list_in_company(
            self._company_id(), status, assignee_id, limit, offset
        )

    def create(self, data: dict) -> dict:
        """수동 업무 생성(#45): task 필수. assignee_id 지정 시 같은 company 구성원만."""
        company_id = self._company_id()
        source = data or {}

        task_text = (source.get('task') or '').strip()
        if not task_text:
            raise ValueError('업무 내용은 필수입니다.')

        assignee_id = source.get('assignee_id')
        assignee_id = self._valid_assignee(assignee_id, company_id) if assignee_id else None

        due_date = source.get('due_date') or None
        return self.tasks.create(company_id, task_text, assignee_id, due_date)

    def update(self, task_id: str, data: dict) -> dict:
        company_id = self._company_id()
        task = self._get_or_404(task_id, company_id)
        self._authorize_modify(task, company_id)

        source = data or {}
        payload: dict = {}

        if 'task' in source:
            task_text = (source.get('task') or '').strip()
            if not task_text:
                raise ValueError('업무 내용은 비울 수 없습니다.')
            payload['task'] = task_text
        if 'due_date' in source:
            payload['due_date'] = source.get('due_date')
        if 'status' in source:
            payload['status'] = self._valid_status(source.get('status'))
        if 'assignee_id' in source:
            payload['assignee_id'] = self._valid_assignee(source.get('assignee_id'), company_id)

        if not payload:
            raise ValueError('수정할 내용이 없습니다.')
        return self.tasks.update_in_company(task_id, company_id, payload)

    def update_status(self, task_id: str, status: str) -> dict:
        company_id = self._company_id()
        task = self._get_or_404(task_id, company_id)
        self._authorize_modify(task, company_id)
        return self.tasks.update_in_company(
            task_id, company_id, {'status': self._valid_status(status)}
        )

    def update_assignee(self, task_id: str, assignee_id: str) -> dict:
        company_id = self._company_id()
        task = self._get_or_404(task_id, company_id)
        self._authorize_modify(task, company_id)
        valid_assignee = self._valid_assignee(assignee_id, company_id)
        return self.tasks.update_in_company(
            task_id, company_id, {'assignee_id': valid_assignee}
        )

    # ---- helpers ----
    def _get_or_404(self, task_id: str, company_id: str) -> dict:
        task = self.tasks.find_in_company(task_id, company_id)
        if task is None:
            raise LookupError('업무를 찾을 수 없습니다.')
        return task

    def _authorize_modify(self, task: dict, company_id: str) -> None:
        """업무 수정 인가(P1-3): 담당자 본인 또는 ADMIN만 허용.

        담당자가 지정되지 않은(assignee_id=None) 업무는 본인 일치가 성립할 수 없으므로
        ADMIN만 수정 가능하다 (의도된 정책).
        """
        user_id = self._user_id()
        if task.get('assignee_id') == user_id:
            return
        if member_role(user_id, company_id) == 'ADMIN':
            return
        raise PermissionError('이 업무를 수정할 권한이 없습니다. (담당자 또는 관리자만 가능)')

    def _valid_assignee(self, assignee_id: str | None, company_id: str) -> str:
        """담당자 지정 검증(P1-2): 빈값 거부 + 같은 company 구성원만 허용."""
        if not assignee_id or not str(assignee_id).strip():
            raise ValueError('담당자 ID는 필수입니다.')
        if not is_member(assignee_id, company_id):
            raise PermissionError('해당 회사의 구성원만 담당자로 지정할 수 있습니다.')
        return assignee_id

    def _valid_uuid(self, value, field: str):
        """필터용 UUID 형식 검증(P2). 형식 오류는 ValueError(400)."""
        try:
            uuid.UUID(str(value))
        except (ValueError, AttributeError, TypeError):
            raise ValueError(f'{field} 형식이 올바르지 않습니다 (UUID).')
        return value

    def _validate_pagination(self, limit, offset) -> None:
        """페이지네이션 범위 검증(P2): limit 1~100, offset 0 이상의 정수."""
        if limit is not None and (
            not isinstance(limit, int) or isinstance(limit, bool) or limit < 1 or limit > MAX_LIMIT
        ):
            raise ValueError(f'limit 은 1~{MAX_LIMIT} 사이의 정수여야 합니다.')
        if offset is not None and (
            not isinstance(offset, int) or isinstance(offset, bool) or offset < 0
        ):
            raise ValueError('offset 은 0 이상의 정수여야 합니다.')

    def _valid_status(self, status: str) -> str:
        if status not in VALID_STATUSES:
            raise ValueError(
                f'잘못된 상태값입니다: {status} (가능: {", ".join(sorted(VALID_STATUSES))})'
            )
        return status

    def _company_id(self) -> str:
        return require_member_company()

    def _user_id(self) -> str:
        user_id = getattr(getattr(g, 'user', None), 'id', None)
        if not user_id:
            raise PermissionError('인증된 사용자를 확인할 수 없습니다.')
        return user_id
