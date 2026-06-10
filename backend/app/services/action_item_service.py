"""
action_item_service.py
Action Item 비즈니스 로직.
잘못된 요청/자원 없음/권한 없음은 ApiError로 던진다.
"""
from flask import g

from app.repositories.action_item_repository import ActionItemRepository
from app.services.tenant_guard import require_member_company
from app.errors import ApiError

repo = ActionItemRepository()

# 허용 상태값
VALID_STATUSES = {"TODO", "IN_PROGRESS", "DONE", "BLOCKED"}


class ActionItemService:
    # ── 공개 인터페이스 ─────────────────────────────────────────────────────────

    def list_by_minute(self, minute_id: str) -> list[dict]:
        """특정 회의록의 Action Items 목록 (company 격리)."""
        company_id = self._company_id()
        if not repo.minute_belongs_to_company(minute_id, company_id):
            raise ApiError(404, "회의록을 찾을 수 없습니다.")
        return repo.list_by_minute(minute_id, company_id)

    def list_by_company(self) -> list[dict]:
        """회사 전체 Action Items 목록."""
        return repo.list_by_company(self._company_id())

    def get(self, item_id: str) -> dict:
        """단건 조회 + company 검증."""
        item = repo.find_by_id_and_company(item_id, self._company_id())
        if item is None:
            raise ApiError(404, "Action Item을 찾을 수 없습니다.")
        return item

    def create(self, data: dict) -> dict:
        """수동 Action Item 생성."""
        data = data or {}
        minute_id = data.get("minute_id")
        task = data.get("task", "").strip()

        if not minute_id:
            raise ApiError(400, "minute_id는 필수입니다.")
        if not task:
            raise ApiError(400, "task(업무 내용)는 필수입니다.")

        company_id = self._company_id()
        if not repo.minute_belongs_to_company(minute_id, company_id):
            raise ApiError(404, "회의록을 찾을 수 없습니다.")

        status = data.get("status", "TODO")
        if status not in VALID_STATUSES:
            raise ApiError(400, f"status는 {VALID_STATUSES} 중 하나여야 합니다.")

        return repo.create(
            minute_id=minute_id,
            company_id=company_id,
            task=task,
            assignee_id=data.get("assignee_id"),
            due_date=data.get("due_date"),
            status=status,
        )

    def update(self, item_id: str, data: dict) -> dict:
        """상태·내용·담당자·기한 업데이트."""
        data = data or {}
        # 존재·company 검증
        self.get(item_id)

        patch: dict = {}

        if "task" in data:
            task = data["task"].strip()
            if not task:
                raise ApiError(400, "task는 비어있을 수 없습니다.")
            patch["task"] = task

        if "status" in data:
            if data["status"] not in VALID_STATUSES:
                raise ApiError(400, f"status는 {VALID_STATUSES} 중 하나여야 합니다.")
            patch["status"] = data["status"]

        if "assignee_id" in data:
            patch["assignee_id"] = data["assignee_id"]

        if "due_date" in data:
            patch["due_date"] = data["due_date"]

        if not patch:
            raise ApiError(400, "변경할 필드가 없습니다.")

        return repo.update(item_id, patch)

    def delete(self, item_id: str) -> None:
        """Action Item 삭제 (company 검증 포함)."""
        self.get(item_id)  # company 검증
        repo.delete(item_id)

    # ── 내부 헬퍼 ─────────────────────────────────────────────────────────────

    def _company_id(self) -> str:
        # 헤더만 신뢰하면 list/create/update/delete 전 경로에서 cross-tenant IDOR 가 된다.
        # #49 표준대로 멤버십까지 교차검증한다.
        return require_member_company()

    def _user_id(self) -> str:
        user = getattr(g, "user", None)
        user_id = getattr(user, "id", None)
        if not user_id:
            raise ApiError(401, "인증된 사용자를 확인할 수 없습니다.")
        return user_id
