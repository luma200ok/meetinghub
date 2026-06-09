"""
test_minutes.py
라우트 레이어: HTTP 상태코드 + 응답 바디 확인.

서비스가 MinuteService 클래스(g 에서 user/company 읽음)로 변경되어
순수 서비스 단위 테스트는 라우트 통합 테스트로 대체.
repo 는 모듈 수준이므로 patch("app.services.minute_service.repo") 로 교체 가능.
"""
from unittest.mock import patch, MagicMock
from tests.conftest import (
    COMPANY_ID, USER_ID, OTHER_USER_ID, OTHER_COMPANY_ID,
    RESERVATION_ID, auth_headers,
)

# ── 공통 더미 데이터 ───────────────────────────────────────────────────────────

MINUTE_ROW = {
    "id": "minute-uuid-1",
    "reservation_id": RESERVATION_ID,
    "content": "회의 내용입니다.",
    "created_by": USER_ID,
    "author_name": "Alice",
    "created_at": "2024-06-10T10:00:00",
    "reservation": {"id": RESERVATION_ID, "title": "주간 회의"},
}

UPDATED_ROW = {**MINUTE_ROW, "content": "수정된 내용"}


def _repo(**overrides):
    """MinuteRepository 전체를 mock 으로 대체한다."""
    defaults = {
        "reservation_belongs_to_company": True,
        "exists_for_reservation": False,
        "create": MINUTE_ROW,
        "find_by_id": MINUTE_ROW,
        "find_by_reservation": MINUTE_ROW,
        "list_by_company": [MINUTE_ROW],
        "update": UPDATED_ROW,
        "delete": None,
    }
    defaults.update(overrides)
    m = MagicMock()
    for k, v in defaults.items():
        getattr(m, k).return_value = v
    return m


# ── 라우트 테스트 ──────────────────────────────────────────────────────────────

class TestMinuteRoutes:
    def test_create_201(self, client):
        with patch("app.services.minute_service.repo", _repo()):
            resp = client.post(
                "/api/minutes",
                json={"reservation_id": RESERVATION_ID, "content": "HTTP 회의록"},
                headers=auth_headers(),
            )
        assert resp.status_code == 201

    def test_create_missing_reservation_id_400(self, client):
        with patch("app.services.minute_service.repo", _repo()):
            resp = client.post(
                "/api/minutes",
                json={"content": "내용"},
                headers=auth_headers(),
            )
        assert resp.status_code == 400

    def test_create_empty_content_400(self, client):
        with patch("app.services.minute_service.repo", _repo()):
            resp = client.post(
                "/api/minutes",
                json={"reservation_id": RESERVATION_ID, "content": "  "},
                headers=auth_headers(),
            )
        assert resp.status_code == 400

    def test_create_duplicate_409(self, client):
        with patch("app.services.minute_service.repo", _repo(exists_for_reservation=True)):
            resp = client.post(
                "/api/minutes",
                json={"reservation_id": RESERVATION_ID, "content": "두 번째"},
                headers=auth_headers(),
            )
        assert resp.status_code == 409

    def test_create_wrong_company_404(self, client):
        with patch("app.services.minute_service.repo", _repo(reservation_belongs_to_company=False)):
            resp = client.post(
                "/api/minutes",
                json={"reservation_id": RESERVATION_ID, "content": "내용"},
                headers=auth_headers(),
            )
        assert resp.status_code == 404

    def test_list_200(self, client):
        with patch("app.services.minute_service.repo", _repo()):
            resp = client.get("/api/minutes", headers=auth_headers())
        assert resp.status_code == 200
        assert isinstance(resp.get_json(), list)

    def test_list_empty_200(self, client):
        with patch("app.services.minute_service.repo", _repo(list_by_company=[])):
            resp = client.get("/api/minutes", headers=auth_headers())
        assert resp.status_code == 200
        assert resp.get_json() == []

    def test_get_single_200(self, client):
        with patch("app.services.minute_service.repo", _repo()):
            resp = client.get("/api/minutes/minute-uuid-1", headers=auth_headers())
        assert resp.status_code == 200
        assert resp.get_json()["id"] == "minute-uuid-1"

    def test_get_not_found_404(self, client):
        with patch("app.services.minute_service.repo", _repo(find_by_id=None)):
            resp = client.get("/api/minutes/bad-id", headers=auth_headers())
        assert resp.status_code == 404

    def test_get_other_company_404(self, client):
        with patch("app.services.minute_service.repo", _repo(find_by_id=None)):
            resp = client.get(
                "/api/minutes/minute-uuid-1",
                headers=auth_headers(company_id=OTHER_COMPANY_ID),
            )
        assert resp.status_code == 404

    def test_update_200(self, client):
        with patch("app.services.minute_service.repo", _repo()):
            resp = client.put(
                "/api/minutes/minute-uuid-1",
                json={"content": "수정본"},
                headers=auth_headers(),
            )
        assert resp.status_code == 200

    def test_update_empty_content_400(self, client):
        with patch("app.services.minute_service.repo", _repo()):
            resp = client.put(
                "/api/minutes/minute-uuid-1",
                json={"content": ""},
                headers=auth_headers(),
            )
        assert resp.status_code == 400

    def test_update_other_user_403(self, client):
        with patch("app.services.minute_service.repo", _repo()):
            resp = client.put(
                "/api/minutes/minute-uuid-1",
                json={"content": "무단 수정"},
                headers=auth_headers(user_id=OTHER_USER_ID),
            )
        assert resp.status_code == 403

    def test_delete_204(self, client):
        with patch("app.services.minute_service.repo", _repo()):
            resp = client.delete("/api/minutes/minute-uuid-1", headers=auth_headers())
        assert resp.status_code == 204
        assert resp.data == b""

    def test_delete_other_user_403(self, client):
        with patch("app.services.minute_service.repo", _repo()):
            resp = client.delete(
                "/api/minutes/minute-uuid-1",
                headers=auth_headers(user_id=OTHER_USER_ID),
            )
        assert resp.status_code == 403

    def test_get_by_reservation_200(self, client):
        with patch("app.services.minute_service.repo", _repo()):
            resp = client.get(
                f"/api/minutes/by-reservation/{RESERVATION_ID}",
                headers=auth_headers(),
            )
        assert resp.status_code == 200

    def test_get_by_reservation_no_minute_404(self, client):
        with patch("app.services.minute_service.repo", _repo(find_by_reservation=None)):
            resp = client.get(
                f"/api/minutes/by-reservation/{RESERVATION_ID}",
                headers=auth_headers(),
            )
        assert resp.status_code == 404

    def test_health_check(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "ok"
