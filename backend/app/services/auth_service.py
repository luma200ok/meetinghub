"""담당: 김관영 — 회원가입 / 초대"""


class AuthService:
    def signup(self, email: str, password: str) -> dict:
        # TODO: Supabase Auth 회원가입 + users 테이블 생성
        raise NotImplementedError

    def invite(self, email: str, company_id: str) -> dict:
        # TODO: invitations 테이블에 초대 토큰 생성 + 메일 발송
        raise NotImplementedError

    def accept_invite(self, token: str, password: str) -> dict:
        # TODO: 토큰 검증 → 회원 생성 → company_members 등록
        raise NotImplementedError
