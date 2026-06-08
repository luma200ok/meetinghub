from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

from flask import Flask, g

from app.services.auth_service import AuthService
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


if __name__ == '__main__':
    unittest.main()
