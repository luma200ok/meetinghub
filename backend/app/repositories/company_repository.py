from datetime import date

from app.models.company import Company, CompanyMember, Department


class CompanyRepository:
    def get_company(self, company_id: int) -> Company:
        return Company(id=company_id, name="A Company", tenant_key="a-company")

    def list_departments(self, company_id: int) -> list[Department]:
        return [
            Department(id=1, company_id=company_id, name="대표"),
            Department(id=2, company_id=company_id, name="CTO", parent_id=1),
            Department(id=3, company_id=company_id, name="백엔드팀", parent_id=2),
            Department(id=4, company_id=company_id, name="프론트엔드팀", parent_id=2),
            Department(id=5, company_id=company_id, name="AI팀", parent_id=2),
        ]

    def list_members(self, company_id: int) -> list[CompanyMember]:
        return [
            CompanyMember(1, company_id, 1, 3, "홍길동", "hong@test.com", "대리", "Backend", date(2025, 3, 3), "USER", "ACTIVE"),
            CompanyMember(2, company_id, 2, 5, "김승현", "kim@test.com", "매니저", "AI Engineer", date(2024, 10, 1), "USER", "ACTIVE"),
            CompanyMember(3, company_id, 3, 2, "김관영", "admin@test.com", "팀장", "Company Admin", date(2024, 1, 8), "ADMIN", "ACTIVE"),
        ]
