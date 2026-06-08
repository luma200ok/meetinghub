from types import SimpleNamespace
import unittest
from unittest.mock import patch

from flask import Flask, g

from app.services.task_service import TaskService
from app.services.search_service import SearchService


class TaskFeatureTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)

    @patch('app.services.task_service.ActionItemRepository')
    def test_invalid_status_rejected(self, repo_cls):
        repo_cls.return_value.find_in_company.return_value = {'id': 't1'}
        with self.app.test_request_context():
            g.user = SimpleNamespace(id='u1')
            g.company_id = 'c1'
            with self.assertRaises(ValueError):
                TaskService().update_status('t1', 'WRONG_STATUS')

    @patch('app.services.task_service.ActionItemRepository')
    def test_update_status_valid(self, repo_cls):
        repo_cls.return_value.find_in_company.return_value = {'id': 't1'}
        repo_cls.return_value.update_in_company.return_value = {'id': 't1', 'status': 'DONE'}
        with self.app.test_request_context():
            g.user = SimpleNamespace(id='u1')
            g.company_id = 'c1'
            result = TaskService().update_status('t1', 'DONE')
        repo_cls.return_value.update_in_company.assert_called_once_with('t1', 'c1', {'status': 'DONE'})
        self.assertEqual(result['status'], 'DONE')

    @patch('app.services.task_service.ActionItemRepository')
    def test_task_not_found_raises_lookup(self, repo_cls):
        repo_cls.return_value.find_in_company.return_value = None
        with self.app.test_request_context():
            g.user = SimpleNamespace(id='u1')
            g.company_id = 'c1'
            with self.assertRaises(LookupError):
                TaskService().update_status('missing', 'DONE')

    @patch('app.services.task_service.ActionItemRepository')
    def test_list_filters_by_company(self, repo_cls):
        repo_cls.return_value.list_in_company.return_value = []
        with self.app.test_request_context():
            g.user = SimpleNamespace(id='u1')
            g.company_id = 'c1'
            TaskService().list(status='TODO')
        repo_cls.return_value.list_in_company.assert_called_once_with('c1', 'TODO', None)

    @patch('app.services.task_service.ActionItemRepository')
    def test_missing_company_header_rejected(self, repo_cls):
        with self.app.test_request_context():
            g.user = SimpleNamespace(id='u1')  # company_id 없음
            with self.assertRaises(ValueError):
                TaskService().list()


class SearchFeatureTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)

    def test_empty_query_returns_empty_groups(self):
        with self.app.test_request_context():
            g.company_id = 'c1'
            result = SearchService().search('   ')
        self.assertEqual(result, {'reservations': [], 'minutes': [], 'tasks': []})


if __name__ == '__main__':
    unittest.main()
