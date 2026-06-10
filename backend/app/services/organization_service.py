"""담당: 김관영 — 조직도 (부서 / 직급 / 직원)"""
from flask import g

from app.repositories.auth_repository import UserRepository
from app.repositories.organization_repository import (
    DepartmentRepository,
    OrganizationMemberRepository,
    PositionRepository,
)
from app.services.tenant_guard import require_member_company, member_role


class OrganizationService:
    def __init__(self):
        self.departments = DepartmentRepository()
        self.positions = PositionRepository()
        self.members = OrganizationMemberRepository()

    # 부서
    def list_departments(self) -> list[dict]:
        return self.departments.find_all(require_member_company())

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
        return self.positions.find_all(require_member_company())

    def create_position(self, data: dict) -> dict:
        self._require_admin()
        payload = self._position_payload(data)
        return self.positions.insert(payload)

    # 직원
    def list_members(self) -> list[dict]:
        return self.members.list_members(require_member_company())

    def update_member(self, member_id: str, data: dict) -> dict:
        self._require_admin()
        company_id = self._company_id()
        member = self.members.find_in_company(member_id, company_id)
        if member is None:
            raise LookupError('직원을 찾을 수 없습니다.')

        source = data or {}
        allowed_fields = {'name', 'department_id', 'position_id'}
        if not allowed_fields.intersection(source):
            raise ValueError('수정할 직원 정보가 없습니다.')

        name = None
        if 'name' in source:
            name = (source.get('name') or '').strip()
            if not name:
                raise ValueError('직원 이름은 필수입니다.')

        member_payload = {}
        if 'department_id' in source:
            department_id = source.get('department_id') or None
            if department_id and self.departments.find_in_company(department_id, company_id) is None:
                raise ValueError('해당 회사의 부서를 찾을 수 없습니다.')
            member_payload['department_id'] = department_id

        if 'position_id' in source:
            position_id = source.get('position_id') or None
            if position_id and self.positions.find_in_company(position_id, company_id) is None:
                raise ValueError('해당 회사의 직급을 찾을 수 없습니다.')
            member_payload['position_id'] = position_id

        user_id = member.get('user_id')
        if not user_id:
            raise LookupError('직원 계정 정보를 찾을 수 없습니다.')
        if name is not None:
            UserRepository().update_name(user_id, name)
        if member_payload:
            self.members.update_in_company(member_id, company_id, member_payload)

        updated = self.members.get_member(member_id, company_id)
        if updated is None:
            raise LookupError('직원을 찾을 수 없습니다.')
        return updated

    def _company_id(self) -> str:
        return require_member_company()

    def _user_id(self) -> str:
        user_id = getattr(getattr(g, 'user', None), 'id', None)
        if not user_id:
            raise PermissionError('인증된 사용자를 확인할 수 없습니다.')
        return user_id

    def _require_admin(self) -> None:
        role = member_role(self._user_id(), self._company_id())
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
            # 직급 레벨은 1 이상의 양수만 허용(0·음수 입력 차단).
            if level < 1:
                raise ValueError('직급 레벨은 1 이상이어야 합니다.')

        return {
            'company_id': self._company_id(),
            'name': name,
            'level': level,
        }
