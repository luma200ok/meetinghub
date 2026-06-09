"""AI / Action-Item 서비스 cross-tenant IDOR 회귀 테스트.

ai_service / action_item_service 의 _company_id() 가 X-Company-Id 헤더만 신뢰하던
IDOR 를 require_member_company()(멤버십 교차검증, #49 표준)로 막았다.
헤더를 위조한 비구성원이 거부되는지 잠가, 추후 헤더-신뢰로 되돌아가는 회귀를 막는다.
"""
from contextlib import contextmanager
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from flask import Flask, g

from app.services.ai_service import AiService
from app.services.action_item_service import ActionItemService


class AiActionItemIdorTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)

    @contextmanager
    def _ctx(self, user_id="attacker", company_id="victim-co"):
        # g.company_id = 공격자가 위조한 타 회사 헤더값
        with self.app.test_request_context():
            g.user = SimpleNamespace(id=user_id)
            g.company_id = company_id
            yield

    @patch("app.services.tenant_guard.CompanyMemberRepository")
    def test_get_summary_rejects_non_member(self, member_cls):
        member_cls.return_value.find_by_user_company.return_value = None  # 비구성원
        with self._ctx():
            with self.assertRaises(PermissionError):
                AiService().get_summary("minute-x")

    @patch("app.services.tenant_guard.CompanyMemberRepository")
    def test_action_item_list_by_company_rejects_non_member(self, member_cls):
        member_cls.return_value.find_by_user_company.return_value = None
        with self._ctx():
            with self.assertRaises(PermissionError):
                ActionItemService().list_by_company()

    @patch("app.services.tenant_guard.CompanyMemberRepository")
    def test_action_item_create_rejects_non_member(self, member_cls):
        member_cls.return_value.find_by_user_company.return_value = None
        with self._ctx():
            with self.assertRaises(PermissionError):
                ActionItemService().create({"minute_id": "m", "task": "t"})

    @patch("app.services.tenant_guard.CompanyMemberRepository")
    def test_member_passes_guard(self, member_cls):
        # 구성원이면 _company_id() 단계는 통과해야 한다(이후 단계는 별도 검증).
        member_cls.return_value.find_by_user_company.return_value = {"id": "m", "role": "MEMBER"}
        with self._ctx():
            # list_by_company 는 멤버십 통과 후 repo 를 호출하므로 repo 만 막아 통과를 확인
            with patch("app.services.action_item_service.repo") as repo:
                repo.list_by_company.return_value = []
                result = ActionItemService().list_by_company()
        self.assertEqual(result, [])


if __name__ == "__main__":
    unittest.main()
