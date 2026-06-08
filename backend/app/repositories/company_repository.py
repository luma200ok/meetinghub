from app.repositories.auth_repository import CompanyMemberRepository
from app.repositories.base import BaseRepository


class CompanyRepository(BaseRepository):
    table_name = 'companies'

    def create(self, name: str) -> dict:
        return self.insert({'name': name})

    def find_for_member(self, company_id: str, user_id: str) -> dict | None:
        membership = CompanyMemberRepository().find_by_user_company(user_id, company_id)
        if not membership:
            return None
        return self.find_by_id(company_id)
