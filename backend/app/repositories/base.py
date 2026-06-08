"""Supabase 테이블 공통 CRUD 베이스. 각 레포는 table_name만 지정해 상속."""
from app.utils.supabase import get_supabase


class BaseRepository:
    table_name: str = ''

    @property
    def table(self):
        return get_supabase().table(self.table_name)

    def find_all(self, company_id: str) -> list[dict]:
        response = self.table.select('*').eq('company_id', company_id).execute()
        return response.data or []

    def find_by_id(self, row_id: str) -> dict | None:
        response = self.table.select('*').eq('id', row_id).limit(1).execute()
        rows = response.data or []
        return rows[0] if rows else None

    def insert(self, data: dict) -> dict:
        response = self.table.insert(data).execute()
        rows = response.data or []
        return rows[0] if rows else {}

    def update(self, row_id: str, data: dict) -> dict:
        response = self.table.update(data).eq('id', row_id).execute()
        rows = response.data or []
        return rows[0] if rows else {}

    def delete(self, row_id: str) -> None:
        self.table.delete().eq('id', row_id).execute()
