from app.repositories.base import BaseRepository
from app.utils.supabase import get_supabase


class DepartmentRepository(BaseRepository):
    table_name = 'departments'

    def find_in_company(self, department_id: str, company_id: str) -> dict | None:
        response = (
            self.table.select('*')
            .eq('id', department_id)
            .eq('company_id', company_id)
            .limit(1)
            .execute()
        )
        rows = response.data or []
        return rows[0] if rows else None

    def update_in_company(self, department_id: str, company_id: str, data: dict) -> dict:
        response = (
            self.table.update(data)
            .eq('id', department_id)
            .eq('company_id', company_id)
            .execute()
        )
        rows = response.data or []
        return rows[0] if rows else {}

    def delete_in_company(self, department_id: str, company_id: str) -> None:
        self.table.delete().eq('id', department_id).eq('company_id', company_id).execute()


class PositionRepository(BaseRepository):
    table_name = 'positions'


class OrganizationMemberRepository(BaseRepository):
    table_name = 'company_members'

    def list_members(self, company_id: str) -> list[dict]:
        sb = get_supabase()
        members = (
            self.table.select('*')
            .eq('company_id', company_id)
            .order('created_at')
            .execute()
            .data
            or []
        )
        if not members:
            return []

        user_ids = [member['user_id'] for member in members if member.get('user_id')]
        department_ids = [member['department_id'] for member in members if member.get('department_id')]
        position_ids = [member['position_id'] for member in members if member.get('position_id')]

        users = self._fetch_by_ids(sb, 'users', user_ids)
        departments = self._fetch_by_ids(sb, 'departments', department_ids)
        positions = self._fetch_by_ids(sb, 'positions', position_ids)

        return [
            {
                **member,
                'user': users.get(member.get('user_id')),
                'department': departments.get(member.get('department_id')),
                'position': positions.get(member.get('position_id')),
            }
            for member in members
        ]

    def _fetch_by_ids(self, sb, table_name: str, ids: list[str]) -> dict[str, dict]:
        if not ids:
            return {}
        response = sb.table(table_name).select('*').in_('id', list(set(ids))).execute()
        return {row['id']: row for row in response.data or []}
