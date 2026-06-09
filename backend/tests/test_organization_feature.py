import os
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

from flask import Flask, g

from app.services.auth_service import AuthService
from app import create_app
from app.services.company_service import CompanyService
from app.services.organization_service import OrganizationService


class OrganizationFeatureTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)

    @patch('app.services.company_service.UserRepository')
    @patch('app.services.company_service.CompanyMemberRepository')
    @patch('app.services.company_service.CompanyRepository')
    def test_company_creator_becomes_admin(self, company_repo_cls, member_repo_cls, user_repo_cls):
        company_repo_cls.return_value.create.return_value = {'id': 'company-1', 'name': 'Acme'}
        member_repo_cls.return_value.add_member.return_value = {
            'user_id': 'user-1',
            'company_id': 'company-1',
            'role': 'ADMIN',
        }

        with self.app.test_request_context():
            g.user = SimpleNamespace(id='user-1', email='owner@example.com')

            result = CompanyService().create({'name': 'Acme'})

        member_repo_cls.return_value.add_member.assert_called_once_with(
            'user-1',
            'company-1',
            role='ADMIN',
        )
        user_repo_cls.return_value.upsert_profile.assert_called_once_with('user-1', 'owner@example.com')
        self.assertEqual(result['member']['role'], 'ADMIN')

    @patch('app.services.auth_service.uuid4')
    @patch('app.services.auth_service.InvitationRepository')
    @patch('app.services.auth_service.CompanyMemberRepository')
    def test_only_admin_can_invite_member(self, member_repo_cls, invitation_repo_cls, uuid4_mock):
        member_repo_cls.return_value.role_for.return_value = 'ADMIN'
        invitation_repo_cls.return_value.create.return_value = {
            'id': 'invite-1',
            'email': 'member@example.com',
            'company_id': 'company-1',
            'token': 'token-1',
        }
        uuid4_mock.return_value = 'token-1'

        with self.app.test_request_context():
            g.user = SimpleNamespace(id='admin-1')

            result = AuthService().invite('MEMBER@example.com', 'company-1')

        member_repo_cls.return_value.role_for.assert_called_once_with('admin-1', 'company-1')
        invitation_repo_cls.return_value.create.assert_called_once_with(
            'member@example.com',
            'company-1',
            'token-1',
        )
        self.assertEqual(result['invite_url'], '/invite/token-1')

    @patch('app.services.auth_service.create_auth_user')
    @patch('app.services.auth_service.authenticate_auth_user')
    @patch('app.services.auth_service.UserRepository')
    @patch('app.services.auth_service.InvitationRepository')
    @patch('app.services.auth_service.CompanyMemberRepository')
    def test_existing_user_accept_invite_requires_password_verification(
        self,
        member_repo_cls,
        invitation_repo_cls,
        user_repo_cls,
        authenticate_mock,
        create_mock,
    ):
        invitation_repo_cls.return_value.find_by_token.return_value = {
            'id': 'invite-1',
            'email': 'member@example.com',
            'company_id': 'company-1',
            'accepted': False,
        }
        user_repo_cls.return_value.find_by_email.return_value = {
            'id': 'user-1',
            'email': 'member@example.com',
        }
        authenticate_mock.return_value = SimpleNamespace(
            user=SimpleNamespace(id='user-1'),
            session=SimpleNamespace(
                access_token='access-1',
                refresh_token='refresh-1',
                expires_at=123,
            ),
        )
        member_repo_cls.return_value.add_member.return_value = {
            'user_id': 'user-1',
            'company_id': 'company-1',
            'role': 'MEMBER',
        }

        result = AuthService().accept_invite('token-1', 'secret')

        authenticate_mock.assert_called_once_with('member@example.com', 'secret')
        create_mock.assert_not_called()
        member_repo_cls.return_value.add_member.assert_called_once_with(
            'user-1',
            'company-1',
            role='MEMBER',
        )
        invitation_repo_cls.return_value.mark_accepted.assert_called_once_with('invite-1')
        self.assertEqual(result['session']['access_token'], 'access-1')

    @patch('app.services.auth_service.authenticate_auth_user')
    @patch('app.services.auth_service.UserRepository')
    @patch('app.services.auth_service.InvitationRepository')
    @patch('app.services.auth_service.CompanyMemberRepository')
    def test_existing_user_accept_invite_rejects_invalid_password(
        self,
        member_repo_cls,
        invitation_repo_cls,
        user_repo_cls,
        authenticate_mock,
    ):
        invitation_repo_cls.return_value.find_by_token.return_value = {
            'id': 'invite-1',
            'email': 'member@example.com',
            'company_id': 'company-1',
            'accepted': False,
        }
        user_repo_cls.return_value.find_by_email.return_value = {
            'id': 'user-1',
            'email': 'member@example.com',
        }
        authenticate_mock.side_effect = RuntimeError('invalid credentials')

        with self.assertRaises(PermissionError):
            AuthService().accept_invite('token-1', 'wrong')

        member_repo_cls.return_value.add_member.assert_not_called()
        invitation_repo_cls.return_value.mark_accepted.assert_not_called()

    @patch('app.services.organization_service.CompanyMemberRepository')
    @patch('app.services.organization_service.PositionRepository')
    @patch('app.services.organization_service.OrganizationMemberRepository')
    @patch('app.services.organization_service.DepartmentRepository')
    def test_admin_create_department_injects_company_id(
        self,
        department_repo_cls,
        _member_list_repo_cls,
        _position_repo_cls,
        member_repo_cls,
    ):
        member_repo_cls.return_value.role_for.return_value = 'ADMIN'
        department_repo = department_repo_cls.return_value
        department_repo.insert.return_value = {
            'id': 'dept-1',
            'company_id': 'company-1',
            'name': 'Product',
        }

        with self.app.test_request_context(headers={'X-Company-Id': 'company-1'}):
            g.user = SimpleNamespace(id='admin-1')
            g.company_id = 'company-1'

            result = OrganizationService().create_department({'name': 'Product'})

        member_repo_cls.return_value.role_for.assert_called_once_with('admin-1', 'company-1')
        department_repo.insert.assert_called_once_with({
            'company_id': 'company-1',
            'name': 'Product',
        })
        self.assertEqual(result['company_id'], 'company-1')

    @patch('app.services.organization_service.CompanyMemberRepository')
    @patch('app.services.organization_service.PositionRepository')
    @patch('app.services.organization_service.OrganizationMemberRepository')
    @patch('app.services.organization_service.DepartmentRepository')
    def test_member_cannot_create_department(
        self,
        _department_repo_cls,
        _member_list_repo_cls,
        _position_repo_cls,
        member_repo_cls,
    ):
        member_repo_cls.return_value.role_for.return_value = 'MEMBER'

        with self.app.test_request_context(headers={'X-Company-Id': 'company-1'}):
            g.user = SimpleNamespace(id='member-1')
            g.company_id = 'company-1'

            with self.assertRaises(PermissionError):
                OrganizationService().create_department({'name': 'Product'})

    # ── cross-tenant IDOR 방어 (#30) ──────────────────────────────────────────
    # 조회 3종(부서/직급/직원)은 헤더 회사의 실제 구성원만 허용.
    # 비구성원이면 PermissionError(→403), PII(직원 목록 등)가 새지 않아야 한다.

    @patch('app.services.organization_service.OrganizationMemberRepository')
    @patch('app.services.organization_service.PositionRepository')
    @patch('app.services.organization_service.DepartmentRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_list_departments_non_member_rejected(
        self, member_cls, department_repo_cls, _position_repo_cls, _member_list_repo_cls,
    ):
        member_cls.return_value.find_by_user_company.return_value = None
        with self.app.test_request_context(headers={'X-Company-Id': 'other-company'}):
            g.user = SimpleNamespace(id='outsider-1')
            g.company_id = 'other-company'
            with self.assertRaises(PermissionError):
                OrganizationService().list_departments()
        department_repo_cls.return_value.find_all.assert_not_called()

    @patch('app.services.organization_service.OrganizationMemberRepository')
    @patch('app.services.organization_service.PositionRepository')
    @patch('app.services.organization_service.DepartmentRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_list_positions_non_member_rejected(
        self, member_cls, _department_repo_cls, position_repo_cls, _member_list_repo_cls,
    ):
        member_cls.return_value.find_by_user_company.return_value = None
        with self.app.test_request_context(headers={'X-Company-Id': 'other-company'}):
            g.user = SimpleNamespace(id='outsider-1')
            g.company_id = 'other-company'
            with self.assertRaises(PermissionError):
                OrganizationService().list_positions()
        position_repo_cls.return_value.find_all.assert_not_called()

    @patch('app.services.organization_service.OrganizationMemberRepository')
    @patch('app.services.organization_service.PositionRepository')
    @patch('app.services.organization_service.DepartmentRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_list_members_non_member_rejected_no_pii_leak(
        self, member_cls, _department_repo_cls, _position_repo_cls, member_list_repo_cls,
    ):
        # 핵심: 비구성원에게 직원 PII(이메일·이름)가 절대 반환되면 안 된다.
        member_cls.return_value.find_by_user_company.return_value = None
        with self.app.test_request_context(headers={'X-Company-Id': 'other-company'}):
            g.user = SimpleNamespace(id='outsider-1')
            g.company_id = 'other-company'
            with self.assertRaises(PermissionError):
                OrganizationService().list_members()
        member_list_repo_cls.return_value.list_members.assert_not_called()

    @patch('app.services.organization_service.OrganizationMemberRepository')
    @patch('app.services.organization_service.PositionRepository')
    @patch('app.services.organization_service.DepartmentRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_list_members_member_allowed(
        self, member_cls, _department_repo_cls, _position_repo_cls, member_list_repo_cls,
    ):
        # 회귀 방지: 정상 구성원은 조회가 통과해야 한다.
        member_cls.return_value.find_by_user_company.return_value = {'id': 'm', 'role': 'MEMBER'}
        member_list_repo_cls.return_value.list_members.return_value = [
            {'user_id': 'u1', 'name': 'Alice', 'email': 'alice@example.com'},
        ]
        with self.app.test_request_context(headers={'X-Company-Id': 'company-1'}):
            g.user = SimpleNamespace(id='member-1')
            g.company_id = 'company-1'
            result = OrganizationService().list_members()
        member_list_repo_cls.return_value.list_members.assert_called_once_with('company-1')
        self.assertEqual(result[0]['email'], 'alice@example.com')

    def test_standard_errors_are_registered_in_error_module(self):
        with patch.dict(os.environ, {
            'SECRET_KEY': 'test-secret',
            'SUPABASE_URL': 'https://example.supabase.co',
            'SUPABASE_SERVICE_KEY': 'service-key',
            'OPENAI_API_KEY': 'openai-key',
        }):
            app = create_app()

        @app.get('/bad-request')
        def bad_request():
            raise ValueError('bad request')

        @app.get('/forbidden')
        def forbidden():
            raise PermissionError('forbidden')

        client = app.test_client()

        bad_response = client.get('/bad-request')
        forbidden_response = client.get('/forbidden')

        self.assertEqual(bad_response.status_code, 400)
        self.assertEqual(bad_response.get_json(), {'error': 'bad request'})
        self.assertEqual(forbidden_response.status_code, 403)
        self.assertEqual(forbidden_response.get_json(), {'error': 'forbidden'})


if __name__ == '__main__':
    unittest.main()
