"""담당: 정재봉 — 멀티테넌트 멤버십 가드 (서비스 레이어)

공유 미들웨어(auth/tenant)는 X-Company-Id 헤더의 *존재*만 검증한다.
내 영역(tasks/dashboard/search) 엔드포인트는 여기서 한 단계 더 나아가
"요청 사용자가 그 company의 실제 구성원인지"까지 확인해 cross-tenant 접근을 차단한다.

※ 중앙 미들웨어(require_company) 보강은 전 팀원 엔드포인트에 영향을 주는
  공통 인프라 작업이라 별도(메타/인프라)로 분리한다. 여기서는 내 엔드포인트만 방어한다.
  중앙 보강이 들어와도 본 검증은 defense-in-depth로 무해하게 중복될 뿐이다.
"""
from flask import g

from app.repositories.auth_repository import CompanyMemberRepository


def require_member_company() -> str:
    """g.user 가 g.company_id 의 구성원임을 검증하고 company_id 를 반환한다.

    - 헤더 없음        → ValueError      (400)
    - 인증 사용자 없음 → PermissionError (403)
    - 비구성원         → PermissionError (403)  ← cross-tenant 차단
    """
    company_id = getattr(g, 'company_id', None)
    if not company_id:
        raise ValueError('X-Company-Id 헤더가 필요합니다.')

    user_id = _current_user_id()
    if CompanyMemberRepository().find_by_user_company(user_id, company_id) is None:
        raise PermissionError('해당 회사의 구성원이 아닙니다.')
    return company_id


def member_role(user_id: str, company_id: str) -> str | None:
    """user 의 해당 company 내 역할(ADMIN/MEMBER). 비구성원이면 None."""
    return CompanyMemberRepository().role_for(user_id, company_id)


def is_member(user_id: str, company_id: str) -> bool:
    """user 가 company 의 구성원인지 여부."""
    return CompanyMemberRepository().find_by_user_company(user_id, company_id) is not None


def _current_user_id() -> str:
    user_id = getattr(getattr(g, 'user', None), 'id', None)
    if not user_id:
        raise PermissionError('인증된 사용자를 확인할 수 없습니다.')
    return user_id
