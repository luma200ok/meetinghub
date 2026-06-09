from app.repositories.base import BaseRepository
from app.utils.supabase import get_supabase


class UserRepository(BaseRepository):
    table_name = 'users'

    def find_by_email(self, email: str) -> dict | None:
        response = self.table.select('*').eq('email', email).limit(1).execute()
        rows = response.data or []
        return rows[0] if rows else None

    def upsert_profile(self, user_id: str, email: str, name: str | None = None) -> dict:
        payload = {'id': user_id, 'email': email}
        if name:
            payload['name'] = name

        response = self.table.upsert(payload, on_conflict='id').execute()
        rows = response.data or []
        return rows[0] if rows else payload


class InvitationRepository(BaseRepository):
    table_name = 'invitations'

    def find_by_token(self, token: str) -> dict | None:
        response = self.table.select('*').eq('token', token).limit(1).execute()
        rows = response.data or []
        return rows[0] if rows else None

    def create(self, email: str, company_id: str, token: str) -> dict:
        return self.insert({'email': email, 'company_id': company_id, 'token': token})

    def mark_accepted(self, invitation_id: str) -> dict:
        return self.update(invitation_id, {'accepted': True})


class CompanyMemberRepository(BaseRepository):
    table_name = 'company_members'

    def find_by_user_company(self, user_id: str, company_id: str) -> dict | None:
        response = (
            self.table.select('*')
            .eq('user_id', user_id)
            .eq('company_id', company_id)
            .limit(1)
            .execute()
        )
        rows = response.data or []
        return rows[0] if rows else None

    def add_member(
        self,
        user_id: str,
        company_id: str,
        role: str = 'MEMBER',
        department_id: str | None = None,
        position_id: str | None = None,
    ) -> dict:
        existing = self.find_by_user_company(user_id, company_id)
        if existing:
            return existing

        return self.insert({
            'user_id': user_id,
            'company_id': company_id,
            'role': role,
            'department_id': department_id,
            'position_id': position_id,
        })

    def role_for(self, user_id: str, company_id: str) -> str | None:
        member = self.find_by_user_company(user_id, company_id)
        return member['role'] if member else None


def create_auth_user(email: str, password: str):
    return get_supabase().auth.sign_up({'email': email, 'password': password})


def authenticate_auth_user(email: str, password: str):
    return get_supabase().auth.sign_in_with_password({'email': email, 'password': password})
