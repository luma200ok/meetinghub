import unittest
from unittest.mock import Mock, patch
from types import SimpleNamespace

from flask import Flask, g

from app.services.notification_service import NotificationService


class NotificationServiceTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)

    @patch('app.services.notification_service.get_supabase')
    def test_list_returns_user_notifications(self, mock_supabase):
        mock_supabase.return_value.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
            {'id': 'n1', 'user_id': 'user-1', 'message': 'hello', 'is_read': False},
        ]

        with self.app.test_request_context():
            g.user = SimpleNamespace(id='user-1')
            result = NotificationService().list()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['message'], 'hello')

    @patch('app.services.notification_service.get_supabase')
    def test_list_raises_without_user(self, mock_supabase):
        with self.app.test_request_context():
            if hasattr(g, 'user'):
                del g.user
            with self.assertRaises(PermissionError):
                NotificationService().list()

    @patch('app.services.notification_service.get_supabase')
    def test_mark_read_updates_is_read(self, mock_supabase):
        mock_supabase.return_value.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {'id': 'n1', 'is_read': True},
        ]

        with self.app.test_request_context():
            g.user = SimpleNamespace(id='user-1')
            result = NotificationService().mark_read('n1')

        self.assertTrue(result['is_read'])

    @patch('app.services.notification_service.get_supabase')
    def test_mark_read_raises_without_user(self, mock_supabase):
        with self.app.test_request_context():
            if hasattr(g, 'user'):
                del g.user
            with self.assertRaises(PermissionError):
                NotificationService().mark_read('n1')

    @patch('app.services.notification_service.get_supabase')
    def test_mark_read_returns_empty_dict_when_not_found(self, mock_supabase):
        mock_supabase.return_value.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = []

        with self.app.test_request_context():
            g.user = SimpleNamespace(id='user-1')
            result = NotificationService().mark_read('nonexistent')

        self.assertEqual(result, {})

    @patch('app.services.notification_service.get_supabase')
    def test_mark_all_read_returns_counts(self, mock_supabase):
        mock_supabase.return_value.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {'id': 'n1', 'is_read': True},
            {'id': 'n2', 'is_read': True},
        ]

        with self.app.test_request_context():
            g.user = SimpleNamespace(id='user-1')
            result = NotificationService().mark_all_read()

        self.assertEqual(result['updated_count'], 2)
        self.assertEqual(result['unread_count'], 0)
        self.assertEqual(len(result['notifications']), 2)

    @patch('app.services.notification_service.get_supabase')
    def test_mark_all_read_raises_without_user(self, mock_supabase):
        with self.app.test_request_context():
            if hasattr(g, 'user'):
                del g.user
            with self.assertRaises(PermissionError):
                NotificationService().mark_all_read()


if __name__ == '__main__':
    unittest.main()
