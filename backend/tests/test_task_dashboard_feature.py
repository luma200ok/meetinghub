"""담당: 정재봉 — 업무/검색/대시보드 + 멀티테넌트 격리 테스트

검증 범위:
- P1-1 비구성원 company_id 헤더 거부 (cross-tenant 차단)
- P1-2 타사 user 를 assignee 로 지정 시 거부
- P1-3 업무 수정 인가 (담당자 본인 또는 ADMIN만)
- P2-2 검색어 LIKE 와일드카드 이스케이프
- P2-3 업무 목록 페이지네이션 / 대시보드 count 집계
"""
from contextlib import contextmanager
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from flask import Flask, g

from app.services.task_service import TaskService
from app.services.search_service import SearchService
from app.services.dashboard_service import DashboardService


def _member(member_cls, role='MEMBER'):
    """member_cls(CompanyMemberRepository) 를 '구성원' 으로 설정."""
    inst = member_cls.return_value
    inst.find_by_user_company.return_value = {'id': 'm', 'role': role}
    inst.role_for.return_value = role
    return inst


# ----- fake supabase (dashboard count/data 쿼리용) -----
class _FakeResult:
    def __init__(self, data=None, count=0):
        self.data = [] if data is None else data
        self.count = count


class _FakeQuery:
    def __init__(self, result):
        self._result = result

    def __getattr__(self, _name):
        # select/eq/neq/gte/lt/order/limit/range/ilike 등 모든 체이닝 메서드를 self 로 흡수
        def _chain(*_a, **_k):
            return self
        return _chain

    def execute(self):
        return self._result


class _FakeSupabase:
    def __init__(self, result=None):
        self._result = result or _FakeResult()

    def table(self, _name):
        return _FakeQuery(self._result)


class TaskFeatureTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)

    @contextmanager
    def _ctx(self, user_id='u1', company_id='c1'):
        with self.app.test_request_context():
            g.user = SimpleNamespace(id=user_id)
            g.company_id = company_id
            yield

    # ---- P1-3 인가 / 상태값 ----
    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_invalid_status_rejected(self, member_cls, repo_cls):
        _member(member_cls)
        repo_cls.return_value.find_in_company.return_value = {'id': 't1', 'assignee_id': 'u1'}
        with self._ctx():
            with self.assertRaises(ValueError):
                TaskService().update_status('t1', 'WRONG_STATUS')

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_update_status_valid(self, member_cls, repo_cls):
        _member(member_cls)
        repo_cls.return_value.find_in_company.return_value = {'id': 't1', 'assignee_id': 'u1'}
        repo_cls.return_value.update_in_company.return_value = {'id': 't1', 'status': 'DONE'}
        with self._ctx():
            result = TaskService().update_status('t1', 'DONE')
        repo_cls.return_value.update_in_company.assert_called_once_with('t1', 'c1', {'status': 'DONE'})
        self.assertEqual(result['status'], 'DONE')

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_task_not_found_raises_lookup(self, member_cls, repo_cls):
        _member(member_cls)
        repo_cls.return_value.find_in_company.return_value = None
        with self._ctx():
            with self.assertRaises(LookupError):
                TaskService().update_status('missing', 'DONE')

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_non_assignee_non_admin_cannot_modify(self, member_cls, repo_cls):
        # P1-3: 담당자도 ADMIN도 아니면 수정 불가
        _member(member_cls, role='MEMBER')
        repo_cls.return_value.find_in_company.return_value = {'id': 't1', 'assignee_id': 'someone_else'}
        with self._ctx():
            with self.assertRaises(PermissionError):
                TaskService().update_status('t1', 'DONE')

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_admin_can_modify_others_task(self, member_cls, repo_cls):
        # P1-3: ADMIN은 타인 업무도 수정 가능
        _member(member_cls, role='ADMIN')
        repo_cls.return_value.find_in_company.return_value = {'id': 't1', 'assignee_id': 'someone_else'}
        repo_cls.return_value.update_in_company.return_value = {'id': 't1', 'status': 'DONE'}
        with self._ctx():
            result = TaskService().update_status('t1', 'DONE')
        self.assertEqual(result['status'], 'DONE')

    # ---- P1-1 cross-tenant ----
    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_non_member_company_rejected(self, member_cls, repo_cls):
        # P1-1: 비구성원 company_id 헤더 → 403(PermissionError)
        member_cls.return_value.find_by_user_company.return_value = None
        with self._ctx():
            with self.assertRaises(PermissionError):
                TaskService().list()
        repo_cls.return_value.list_in_company.assert_not_called()

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_missing_company_header_rejected(self, member_cls, repo_cls):
        with self.app.test_request_context():
            g.user = SimpleNamespace(id='u1')  # company_id 없음
            with self.assertRaises(ValueError):
                TaskService().list()

    # ---- P1-2 타사 assignee 방어 ----
    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_assignee_must_be_member(self, member_cls, repo_cls):
        # update_assignee: 타사 user 지정 시 거부
        inst = member_cls.return_value
        inst.find_by_user_company.side_effect = (
            lambda user_id, company_id: {'id': 'm', 'role': 'MEMBER'} if user_id == 'u1' else None
        )
        inst.role_for.return_value = 'MEMBER'
        repo_cls.return_value.find_in_company.return_value = {'id': 't1', 'assignee_id': 'u1'}
        with self._ctx():
            with self.assertRaises(PermissionError):
                TaskService().update_assignee('t1', 'outsider-999')
        repo_cls.return_value.update_in_company.assert_not_called()

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_update_rejects_cross_tenant_assignee(self, member_cls, repo_cls):
        # PUT update 의 assignee_id 분기도 동일 방어
        inst = member_cls.return_value
        inst.find_by_user_company.side_effect = (
            lambda user_id, company_id: {'id': 'm', 'role': 'MEMBER'} if user_id == 'u1' else None
        )
        inst.role_for.return_value = 'MEMBER'
        repo_cls.return_value.find_in_company.return_value = {'id': 't1', 'assignee_id': 'u1'}
        with self._ctx():
            with self.assertRaises(PermissionError):
                TaskService().update('t1', {'assignee_id': 'outsider-999'})
        repo_cls.return_value.update_in_company.assert_not_called()

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_update_assignee_member_ok(self, member_cls, repo_cls):
        _member(member_cls)  # 모든 user 구성원
        repo_cls.return_value.find_in_company.return_value = {'id': 't1', 'assignee_id': 'u1'}
        repo_cls.return_value.update_in_company.return_value = {'id': 't1', 'assignee_id': 'u2'}
        with self._ctx():
            result = TaskService().update_assignee('t1', 'u2')
        repo_cls.return_value.update_in_company.assert_called_once_with('t1', 'c1', {'assignee_id': 'u2'})
        self.assertEqual(result['assignee_id'], 'u2')

    # ---- P2-3 페이지네이션 / 필터 ----
    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_list_filters_by_company(self, member_cls, repo_cls):
        _member(member_cls)
        repo_cls.return_value.list_in_company.return_value = []
        with self._ctx():
            TaskService().list(status='TODO')
        repo_cls.return_value.list_in_company.assert_called_once_with('c1', 'TODO', None, None, None)

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_list_pagination_passthrough(self, member_cls, repo_cls):
        _member(member_cls)
        repo_cls.return_value.list_in_company.return_value = []
        with self._ctx():
            TaskService().list(limit=10, offset=20)
        repo_cls.return_value.list_in_company.assert_called_once_with('c1', None, None, 10, 20)

    # ---- P2: list 입력 검증 ----
    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_list_rejects_invalid_assignee_uuid(self, member_cls, repo_cls):
        _member(member_cls)
        with self._ctx():
            with self.assertRaises(ValueError):
                TaskService().list(assignee_id='not-a-uuid')
        repo_cls.return_value.list_in_company.assert_not_called()

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_list_rejects_out_of_range_pagination(self, member_cls, repo_cls):
        _member(member_cls)
        with self._ctx():
            for limit, offset in [(0, 0), (101, 0), (10, -1)]:
                with self.assertRaises(ValueError):
                    TaskService().list(limit=limit, offset=offset)
        repo_cls.return_value.list_in_company.assert_not_called()

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_list_accepts_valid_uuid_assignee(self, member_cls, repo_cls):
        _member(member_cls)
        repo_cls.return_value.list_in_company.return_value = []
        valid = '11111111-1111-1111-1111-111111111111'
        with self._ctx():
            TaskService().list(assignee_id=valid)
        repo_cls.return_value.list_in_company.assert_called_once_with(
            'c1', None, valid, None, None
        )

    # ---- #45: 수동 업무 생성 ----
    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_create_requires_task_text(self, member_cls, repo_cls):
        _member(member_cls)
        with self._ctx():
            with self.assertRaises(ValueError):
                TaskService().create({'task': '   '})
        repo_cls.return_value.create.assert_not_called()

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_create_unassigned_ok(self, member_cls, repo_cls):
        _member(member_cls)
        repo_cls.return_value.create.return_value = {'id': 't9', 'task': '문서화', 'status': 'TODO'}
        with self._ctx():
            result = TaskService().create({'task': '  문서화  ', 'due_date': '2026-07-01'})
        repo_cls.return_value.create.assert_called_once_with('c1', '문서화', None, '2026-07-01')
        self.assertEqual(result['status'], 'TODO')

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_create_rejects_non_member_assignee(self, member_cls, repo_cls):
        # 요청자(u1)는 구성원, 지정 대상(outsider)은 비구성원
        member_cls.return_value.find_by_user_company.side_effect = (
            lambda u, c: {'id': 'm', 'role': 'MEMBER'} if u == 'u1' else None
        )
        with self._ctx():
            with self.assertRaises(PermissionError):
                TaskService().create({'task': '회의 준비', 'assignee_id': 'outsider'})
        repo_cls.return_value.create.assert_not_called()

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_create_rejects_too_long_task(self, member_cls, repo_cls):
        _member(member_cls)
        with self._ctx():
            with self.assertRaises(ValueError):
                TaskService().create({'task': 'x' * 501})
        repo_cls.return_value.create.assert_not_called()

    @patch('app.services.task_service.ActionItemRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_create_rejects_invalid_due_date(self, member_cls, repo_cls):
        _member(member_cls)
        with self._ctx():
            with self.assertRaises(ValueError):
                TaskService().create({'task': '문서화', 'due_date': 'not-a-date'})
        repo_cls.return_value.create.assert_not_called()


class SearchFeatureTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)

    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_empty_query_returns_empty_groups(self, member_cls):
        _member(member_cls)
        with self.app.test_request_context():
            g.user = SimpleNamespace(id='u1')
            g.company_id = 'c1'
            result = SearchService().search('   ')
        self.assertEqual(result, {'reservations': [], 'minutes': [], 'tasks': []})

    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_empty_query_non_member_rejected(self, member_cls):
        # P2-4: 빈 쿼리라도 비구성원은 차단 (멤버십 검증을 먼저 수행)
        member_cls.return_value.find_by_user_company.return_value = None
        with self.app.test_request_context():
            g.user = SimpleNamespace(id='u1')
            g.company_id = 'c1'
            with self.assertRaises(PermissionError):
                SearchService().search('')

    def test_escape_like_escapes_wildcards(self):
        # P2-2: %, _, \ 가 리터럴로 이스케이프되는지
        svc = SearchService()
        self.assertEqual(svc._escape_like('a%b_c'), 'a\\%b\\_c')
        self.assertEqual(svc._escape_like('back\\slash'), 'back\\\\slash')
        self.assertEqual(svc._escape_like('plain'), 'plain')


class DashboardFeatureTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)

    @patch('app.services.dashboard_service.get_supabase', return_value=_FakeSupabase())
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_summary_shape_with_empty_data(self, member_cls, _sb):
        # P2-3: count 쿼리 기반 집계가 정상 동작하고 응답 형태가 contract와 일치
        _member(member_cls)
        with self.app.test_request_context():
            g.user = SimpleNamespace(id='u1')
            g.company_id = 'c1'
            result = DashboardService().get_summary()
        self.assertEqual(
            set(result.keys()),
            {'today_meetings', 'my_tasks', 'recent_meetings', 'meeting_stats', 'task_stats'},
        )
        self.assertEqual(result['meeting_stats'], {'total': 0, 'this_week': 0})
        self.assertEqual(result['task_stats'], {'todo': 0, 'in_progress': 0, 'done': 0, 'blocked': 0})

    @patch('app.services.dashboard_service.get_supabase', return_value=_FakeSupabase())
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_dashboard_non_member_rejected(self, member_cls, _sb):
        # P1-1: 대시보드도 비구성원 차단
        member_cls.return_value.find_by_user_company.return_value = None
        with self.app.test_request_context():
            g.user = SimpleNamespace(id='u1')
            g.company_id = 'c1'
            with self.assertRaises(PermissionError):
                DashboardService().get_summary()


if __name__ == '__main__':
    unittest.main()
