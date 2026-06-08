from app.repositories.company_repository import CompanyRepository


class OrganizationService:
    def __init__(self):
        self.company_repository = CompanyRepository()

    def get_company(self, company_id: int):
        return self.company_repository.get_company(company_id)

    def get_organization_chart(self, company_id: int) -> dict:
        return {
            "departments": self.company_repository.list_departments(company_id),
            "members": self.company_repository.list_members(company_id),
        }
