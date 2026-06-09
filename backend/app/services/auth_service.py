"""담당: 김관영 — 회원가입 / 초대"""
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from flask import g

from app.repositories.auth_repository import (
    CompanyMemberRepository,
    InvitationRepository,
    UserRepository,
    authenticate_auth_user,
    create_auth_user,
)


class AuthService:
    invitation_ttl = timedelta(days=7)

    def signup(self, email: str, password: str) -> dict:
        email = self._normalize_email(email)
        
        try:
            auth_response = create_auth_user(email, password)
        except Exception as e:
            if "already registered" in str(e).lower() or "user already exists" in str(e).lower():
                raise ValueError('이미 가입된 이메일입니다.')
            raise ValueError(f'회원가입에 실패했습니다: {str(e)}')
            
        user = auth_response.user
        if user is None:
            raise ValueError('회원가입에 실패했습니다.')

        profile = UserRepository().upsert_profile(user.id, email)
        return {
            'user': profile,
            'session': self._serialize_session(getattr(auth_response, 'session', None)),
        }

    def sync_oauth_user(self, user) -> dict:
        email = self._normalize_email(getattr(user, 'email', ''))
        if not email:
            raise ValueError('OAuth 사용자 이메일이 없습니다.')
            
        user_metadata = getattr(user, 'user_metadata', {}) or {}
        name = user_metadata.get('name') or user_metadata.get('full_name')
        
        profile = UserRepository().upsert_profile(user.id, email, name)
        return {'user': profile}

    def invite(self, email: str, company_id: str) -> dict:
        user_id = self._current_user_id()
        role = CompanyMemberRepository().role_for(user_id, company_id)
        if role != 'ADMIN':
            raise PermissionError('ADMIN만 직원을 초대할 수 있습니다.')

        token = str(uuid4())
        invitation = InvitationRepository().create(self._normalize_email(email), company_id, token)
        return {
            **invitation,
            'invite_url': f'/invite/{token}',
        }

    def accept_invite(self, token: str, password: str) -> dict:
        if not password:
            raise ValueError('비밀번호는 필수입니다.')

        invitations = InvitationRepository()
        invitation = invitations.find_by_token(token)
        if invitation is None:
            raise LookupError('초대를 찾을 수 없습니다.')
        if invitation.get('accepted'):
            raise ValueError('이미 사용된 초대입니다.')
        if self._is_expired(invitation):
            raise ValueError('만료된 초대입니다.')

        users = UserRepository()
        email = self._normalize_email(invitation['email'])
        profile = users.find_by_email(email)
        session = None

        if profile is None:
            auth_response = create_auth_user(email, password)
            user = auth_response.user
            if user is None:
                raise ValueError('초대 수락 계정 생성에 실패했습니다.')
            profile = users.upsert_profile(user.id, email)
            session = self._serialize_session(getattr(auth_response, 'session', None))
        else:
            auth_response = self._verify_existing_user(email, password, profile['id'])
            session = self._serialize_session(getattr(auth_response, 'session', None))

        member = CompanyMemberRepository().add_member(
            profile['id'],
            invitation['company_id'],
            role='MEMBER',
        )
        invitations.mark_accepted(invitation['id'])

        return {
            'user': profile,
            'member': member,
            'company_id': invitation['company_id'],
            'session': session,
        }

    def _current_user_id(self) -> str:
        user_id = getattr(getattr(g, 'user', None), 'id', None)
        if not user_id:
            raise PermissionError('인증된 사용자를 확인할 수 없습니다.')
        return user_id

    def _normalize_email(self, email: str) -> str:
        if not email:
            raise ValueError('이메일은 필수입니다.')
        return email.strip().lower()

    def _is_expired(self, invitation: dict) -> bool:
        created_at = invitation.get('created_at')
        if not created_at:
            return False
        parsed = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        return datetime.now(timezone.utc) - parsed > self.invitation_ttl

    def _verify_existing_user(self, email: str, password: str, profile_id: str):
        try:
            auth_response = authenticate_auth_user(email, password)
        except Exception as exc:
            raise PermissionError('초대 수락을 위해 기존 계정 비밀번호 확인이 필요합니다.') from exc

        user = getattr(auth_response, 'user', None)
        if user is None or getattr(user, 'id', None) != profile_id:
            raise PermissionError('초대 수락을 위해 기존 계정 비밀번호 확인이 필요합니다.')
        return auth_response

    def _serialize_session(self, session) -> dict | None:
        if session is None:
            return None
        return {
            'access_token': getattr(session, 'access_token', None),
            'refresh_token': getattr(session, 'refresh_token', None),
            'expires_at': getattr(session, 'expires_at', None),
        }
