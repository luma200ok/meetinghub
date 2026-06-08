"""담당: 김관영 — 기업 생성/조회"""
from flask import g

from app.repositories.auth_repository import CompanyMemberRepository, UserRepository
from app.repositories.company_repository import CompanyRepository


class CompanyService:
    def create(self, data: dict) -> dict:
        user_id = self._current_user_id()
        name = (data or {}).get('name', '').strip()
        if not name:
            raise ValueError('기업명은 필수입니다.')

        company = CompanyRepository().create(name)
        email = getattr(g.user, 'email', None)
        if email:
            UserRepository().upsert_profile(user_id, email)
        member = CompanyMemberRepository().add_member(user_id, company['id'], role='ADMIN')

        return {'company': company, 'member': member}

    def get(self, company_id: str) -> dict:
        user_id = self._current_user_id()
        company = CompanyRepository().find_for_member(company_id, user_id)
        if company is None:
            raise LookupError('기업을 찾을 수 없습니다.')
        return company

    def _current_user_id(self) -> str:
        user_id = getattr(getattr(g, 'user', None), 'id', None)
        if not user_id:
            raise PermissionError('인증된 사용자를 확인할 수 없습니다.')
        return user_id
