"""담당: 김관영 — 조직도 (부서 / 직급 / 직원)"""
from flask import g

from app.repositories.auth_repository import CompanyMemberRepository
from app.repositories.organization_repository import (
    DepartmentRepository,
    OrganizationMemberRepository,
    PositionRepository,
)


class OrganizationService:
    def __init__(self):
        self.departments = DepartmentRepository()
        self.positions = PositionRepository()
        self.members = OrganizationMemberRepository()

    # 부서
    def list_departments(self) -> list[dict]:
        self._require_member()
        return self.departments.find_all(self._company_id())

    def create_department(self, data: dict) -> dict:
        self._require_admin()
        payload = self._department_payload(data)
        return self.departments.insert(payload)

    def update_department(self, dept_id: str, data: dict) -> dict:
        self._require_admin()
        company_id = self._company_id()
        if self.departments.find_in_company(dept_id, company_id) is None:
            raise LookupError('부서를 찾을 수 없습니다.')
        return self.departments.update_in_company(dept_id, company_id, self._department_payload(data, partial=True))

    def delete_department(self, dept_id: str) -> None:
        self._require_admin()
        company_id = self._company_id()
        if self.departments.find_in_company(dept_id, company_id) is None:
            raise LookupError('부서를 찾을 수 없습니다.')
        self.departments.delete_in_company(dept_id, company_id)

    # 직급
    def list_positions(self) -> list[dict]:
        self._require_member()
        return self.positions.find_all(self._company_id())

    def create_position(self, data: dict) -> dict:
        self._require_admin()
        payload = self._position_payload(data)
        return self.positions.insert(payload)

    # 직원
    def list_members(self) -> list[dict]:
        self._require_member()
        return self.members.list_members(self._company_id())

    def _company_id(self) -> str:
        company_id = getattr(g, 'company_id', None)
        if not company_id:
            raise ValueError('X-Company-Id 헤더가 필요합니다.')
        return company_id

    def _user_id(self) -> str:
        user_id = getattr(getattr(g, 'user', None), 'id', None)
        if not user_id:
            raise PermissionError('인증된 사용자를 확인할 수 없습니다.')
        return user_id

    def _require_member(self) -> None:
        member = CompanyMemberRepository().find_by_user_company(self._user_id(), self._company_id())
        if not member:
            raise PermissionError('해당 회사의 멤버만 조회할 수 있습니다.')

    def _require_admin(self) -> None:
        role = CompanyMemberRepository().role_for(self._user_id(), self._company_id())
        if role != 'ADMIN':
            raise PermissionError('ADMIN만 조직 정보를 변경할 수 있습니다.')

    def _department_payload(self, data: dict, partial: bool = False) -> dict:
        source = data or {}
        payload = {
            'company_id': self._company_id(),
        }
        if 'name' in source:
            name = source.get('name', '').strip()
            if not name:
                raise ValueError('부서명은 필수입니다.')
            payload['name'] = name
        elif not partial:
            raise ValueError('부서명은 필수입니다.')

        if 'parent_id' in source:
            parent_id = source.get('parent_id')
            if parent_id and self.departments.find_in_company(parent_id, self._company_id()) is None:
                raise ValueError('상위 부서를 찾을 수 없습니다.')
            payload['parent_id'] = parent_id

        return payload

    def _position_payload(self, data: dict) -> dict:
        source = data or {}
        name = source.get('name', '').strip()
        if not name:
            raise ValueError('직급명은 필수입니다.')

        level = source.get('level')
        if level is not None:
            try:
                level = int(level)
            except (TypeError, ValueError):
                raise ValueError('직급 레벨은 숫자여야 합니다.')

        return {
            'company_id': self._company_id(),
            'name': name,
            'level': level,
        }
