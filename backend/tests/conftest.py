"""
conftest.py
Supabase 와 JWT 미들웨어를 모두 mock 하여 단위/통합 테스트를 격리한다.
meetinghub-1 의 create_app(config_class) 시그니처에 맞게 TestingConfig 를 주입한다.
"""
import os
import pytest
from types import SimpleNamespace
from unittest.mock import MagicMock

# Config 클래스가 모듈 임포트 시 os.environ 을 읽으므로 먼저 환경변수를 설정해야 함
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")

from app import create_app

COMPANY_ID = "company-uuid-1"
USER_ID = "user-uuid-1"
OTHER_USER_ID = "user-uuid-2"
OTHER_COMPANY_ID = "company-uuid-2"
RESERVATION_ID = "res-uuid-1"
OTHER_RES_ID = "res-uuid-2"


class TestingConfig:
    TESTING = True
    SECRET_KEY = "test-secret"
    SUPABASE_URL = "https://test.supabase.co"
    SUPABASE_SERVICE_KEY = "test-service-key"
    OPENAI_API_KEY = "test-openai-key"
    CORS_ORIGINS = ["http://localhost:3000"]


@pytest.fixture(scope="session")
def app():
    return create_app(TestingConfig)


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def mock_supabase(monkeypatch):
    """모든 레이어의 get_supabase() 를 mock 으로 교체한다.
    require_auth 는 임포트 시점에 이미 데코레이터로 적용되므로 monkeypatch 로 교체 불가.
    대신 get_user() 가 Authorization 헤더의 token(=user_id) 을 .id 로 반환하도록 설정.
    """
    mock = MagicMock()

    def fake_get_user(token: str):
        """token = Authorization 헤더에서 'Bearer ' 제거한 값 (테스트에서는 user_id)."""
        user = MagicMock()
        user.id = token
        resp = MagicMock()
        resp.user = user
        return resp

    mock.auth.get_user.side_effect = fake_get_user

    monkeypatch.setattr("app.utils.supabase.get_supabase", lambda: mock)
    monkeypatch.setattr("app.middleware.auth.get_supabase", lambda: mock)
    monkeypatch.setattr("app.repositories.base.get_supabase", lambda: mock)
    monkeypatch.setattr("app.repositories.minute_repository.get_supabase", lambda: mock)
    return mock


@pytest.fixture(autouse=True)
def mock_auth(monkeypatch):
    """
    require_auth 를 패치하여 실제 Supabase 호출 없이
    g.user / g.company_id 를 Authorization·X-Company-Id 헤더에서 직접 주입한다.
    """
    def fake_require_auth(f):
        from functools import wraps
        from flask import request, g

        @wraps(f)
        def decorated(*args, **kwargs):
            auth = request.headers.get("Authorization", "")
            # "Bearer <user_id>"
            user_id = auth.removeprefix("Bearer ").strip() or USER_ID
            company_id = request.headers.get("X-Company-Id", COMPANY_ID)
            g.user = SimpleNamespace(id=user_id)  # .id 로 접근 (main 프로젝트 User 객체 방식)
            g.company_id = company_id
            return f(*args, **kwargs)

        return decorated

    monkeypatch.setattr("app.middleware.auth.require_auth", fake_require_auth)
    monkeypatch.setattr("app.routes.minutes.require_auth", fake_require_auth)


def auth_headers(user_id: str = USER_ID, company_id: str = COMPANY_ID) -> dict:
    return {
        "Authorization": f"Bearer {user_id}",
        "X-Company-Id": company_id,
    }
