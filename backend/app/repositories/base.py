"""Supabase 테이블 공통 CRUD 베이스. 각 레포는 table_name만 지정해 상속."""
from app.utils.supabase import get_supabase


class BaseRepository:
    table_name: str = ''

    @property
    def table(self):
        return get_supabase().table(self.table_name)

    def find_all(self, company_id: str) -> list[dict]:
        # TODO: company_id로 멀티테넌트 필터링
        raise NotImplementedError

    def find_by_id(self, row_id: str) -> dict | None:
        raise NotImplementedError

    def insert(self, data: dict) -> dict:
        raise NotImplementedError

    def update(self, row_id: str, data: dict) -> dict:
        raise NotImplementedError

    def delete(self, row_id: str) -> None:
        raise NotImplementedError
