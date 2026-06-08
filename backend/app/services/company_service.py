"""담당: 김관영 — 기업 생성/조회"""


class CompanyService:
    def create(self, data: dict) -> dict:
        # TODO: companies 생성 + 생성자를 ADMIN으로 company_members 등록
        raise NotImplementedError

    def get(self, company_id: str) -> dict:
        # TODO: 기업 단건 조회
        raise NotImplementedError
