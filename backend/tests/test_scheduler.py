import unittest
from unittest.mock import Mock, patch, PropertyMock
from datetime import datetime, timezone, timedelta


class SchedulerTest(unittest.TestCase):
    def _make_app(self):
        app = Mock()
        app.app_context.return_value.__enter__ = Mock()
        app.app_context.return_value.__exit__ = Mock()
        return app

    def _setup_mock_sb(self, reservations, attendees, existing):
        """Helper: configures a mock supabase client with given table data."""
        sb = Mock()

        res_mock = Mock()
        res_mock.execute.return_value.data = reservations
        res_table = Mock()
        res_table.select.return_value.gte.return_value.lte.return_value.eq.return_value = res_mock

        att_mock = Mock()
        att_mock.execute.return_value.data = attendees
        att_table = Mock()
        att_table.select.return_value.eq.return_value = att_mock

        notif_select_mock = Mock()
        notif_select_mock.execute.return_value.data = existing
        notif_table = Mock()
        notif_table.select.return_value.eq.return_value.eq.return_value.eq.return_value.limit.return_value = notif_select_mock
        notif_table.insert.return_value.execute.return_value.data = [{'id': 'new-n1'}]

        def table_side_effect(name):
            if name == 'meeting_reservations':
                return res_table
            elif name == 'reservation_attendees':
                return att_table
            elif name == 'notifications':
                return notif_table
            return Mock()

        sb.table.side_effect = table_side_effect
        return sb

    @patch('app.utils.supabase.get_supabase')
    def test_send_upcoming_meeting_notifications_creates_notifications(self, mock_get_supabase):
        from app.utils.scheduler import _send_upcoming_meeting_notifications

        now = datetime.now(timezone.utc)
        sb = self._setup_mock_sb(
            reservations=[{'id': 'res-1', 'title': 'Sprint', 'organizer_id': 'user-1', 'start_at': (now + timedelta(minutes=5)).isoformat()}],
            attendees=[{'user_id': 'user-2'}],
            existing=[],
        )
        mock_get_supabase.return_value = sb

        _send_upcoming_meeting_notifications(self._make_app())

        sb.table.assert_any_call('notifications')
        args, _ = sb.table('notifications').insert.call_args
        self.assertIn('user_id', args[0])
        self.assertEqual(args[0]['type'], 'MEETING_REMINDER')

    @patch('app.utils.supabase.get_supabase')
    def test_send_upcoming_meeting_notifications_skips_existing(self, mock_get_supabase):
        from app.utils.scheduler import _send_upcoming_meeting_notifications

        now = datetime.now(timezone.utc)
        sb = self._setup_mock_sb(
            reservations=[{'id': 'res-1', 'title': 'Sprint', 'organizer_id': 'user-1', 'start_at': (now + timedelta(minutes=5)).isoformat()}],
            attendees=[{'user_id': 'user-2'}],
            existing=[{'id': 'existing-n1'}],
        )
        mock_get_supabase.return_value = sb

        _send_upcoming_meeting_notifications(self._make_app())

        self.assertFalse(sb.table('notifications').insert.called)


if __name__ == '__main__':
    unittest.main()
