"""담당: 김관영 — 조직도 (부서 / 직급 / 직원)"""


class OrganizationService:
    # 부서
    def list_departments(self) -> list[dict]:
        raise NotImplementedError

    def create_department(self, data: dict) -> dict:
        raise NotImplementedError

    def update_department(self, dept_id: str, data: dict) -> dict:
        raise NotImplementedError

    def delete_department(self, dept_id: str) -> None:
        raise NotImplementedError

    # 직급
    def list_positions(self) -> list[dict]:
        raise NotImplementedError

    def create_position(self, data: dict) -> dict:
        raise NotImplementedError

    # 직원
    def list_members(self) -> list[dict]:
        raise NotImplementedError
