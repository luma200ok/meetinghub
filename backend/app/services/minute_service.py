"""
minute_service.py
회의록 비즈니스 로직.
잘못된 요청/자원 없음/권한 없음은 ApiError 로 던진다.

MinuteService 클래스: main 프로젝트 stub 인터페이스(list/create/get/update)와 동일.
  g.user.id, g.company_id 를 내부에서 읽음.
repo 는 모듈 수준 — 테스트에서 patch("app.services.minute_service.repo", ...) 로 교체 가능.
"""
from flask import g

from app.repositories.minute_repository import MinuteRepository
from app.errors import ApiError
from app.services.tenant_guard import require_member_company

repo = MinuteRepository()


class MinuteService:
    # ── 공개 인터페이스 ──────────────────────────────────────────────────────────

    def list(self) -> list[dict]:
        return repo.list_by_company(self._company_id())

    def create(self, data: dict) -> dict:
        data = data or {}
        reservation_id = data.get("reservation_id")
        content = data.get("content", "")

        if not reservation_id:
            raise ApiError(400, "reservation_id 는 필수입니다.")
        if not content or not content.strip():
            raise ApiError(400, "회의록 내용을 입력해 주세요.")

        company_id = self._company_id()
        if not repo.reservation_belongs_to_company(reservation_id, company_id):
            raise ApiError(404, "회의 예약을 찾을 수 없습니다.")
        if repo.exists_for_reservation(reservation_id):
            raise ApiError(409, "이미 해당 회의의 회의록이 존재합니다.")

        return repo.create(reservation_id, content.strip(), self._user_id(), company_id)

    def get(self, minute_id: str) -> dict:
        data = repo.find_by_id(minute_id, self._company_id())
        if data is None:
            raise ApiError(404, "회의록을 찾을 수 없습니다.")
        return data

    def get_by_reservation(self, reservation_id: str) -> dict:
        company_id = self._company_id()
        if not repo.reservation_belongs_to_company(reservation_id, company_id):
            raise ApiError(404, "회의 예약을 찾을 수 없습니다.")
        data = repo.find_by_reservation(reservation_id)
        if data is None:
            raise ApiError(404, "해당 회의의 회의록이 없습니다.")
        return data

    def update(self, minute_id: str, data: dict) -> dict:
        data = data or {}
        content = data.get("content", "")
        if not content or not content.strip():
            raise ApiError(400, "회의록 내용을 입력해 주세요.")

        minute = self.get(minute_id)  # company 검증 포함
        if minute["created_by"] != self._user_id():
            raise ApiError(403, "작성자 본인만 수정할 수 있습니다.")

        return repo.update(minute_id, content.strip())

    def delete(self, minute_id: str) -> None:
        minute = self.get(minute_id)  # company 검증 포함
        if minute["created_by"] != self._user_id():
            raise ApiError(403, "작성자 본인만 삭제할 수 있습니다.")
        repo.delete(minute_id)

    # ── 내부 헬퍼 ──────────────────────────────────────────────────────────────

    def _company_id(self) -> str:
        return require_member_company()

    def _user_id(self) -> str:
        # main 프로젝트: g.user = Supabase User 객체 (user.id 로 접근)
        user = getattr(g, "user", None)
        user_id = getattr(user, "id", None)
        if not user_id:
            raise ApiError(401, "인증된 사용자를 확인할 수 없습니다.")
        return user_id
