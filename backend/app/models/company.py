from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class Company:
    id: int
    name: str
    tenant_key: str


@dataclass(frozen=True)
class Department:
    id: int
    company_id: int
    name: str
    parent_id: int | None = None


@dataclass(frozen=True)
class CompanyMember:
    id: int
    company_id: int
    user_id: int
    department_id: int | None
    name: str
    email: str
    position: str
    job_role: str
    joined_on: date | None
    role: str
    status: str
