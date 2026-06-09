"""담당: 김승현 — 회의실 및 예약 핵심 비즈니스 로직 단위 테스트"""
import unittest
from unittest.mock import Mock, patch
from types import SimpleNamespace
from flask import Flask, g

from app.services.meeting_room_service import MeetingRoomService
from app.services.reservation_service import ReservationService, is_overlapping
from app.errors import ApiError


class MeetingRoomReservationFeatureTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)

    # --- 1. 시간대 중복 겹침 조건 테스트 (s1 < e2 AND s2 < e1) ---
    def test_time_overlapping_logic(self):
        # 케이스 A: 겹치는 경우
        # s1: 14:00~15:00 / s2: 14:30~15:30 -> s1 < e2 (14 < 15:30) and s2 < e1 (14:30 < 15) -> True
        self.assertTrue(is_overlapping("2026-06-09T14:00:00", "2026-06-09T15:00:00", 
                                       "2026-06-09T14:30:00", "2026-06-09T15:30:00"))
        
        # 케이스 B: 경계값 (끝나는 시간 == 시작하는 시간)
        # s1: 14:00~15:00 / s2: 15:00~16:00 -> s1 < e2 (14 < 16) and s2 < e1 (15 < 15: False) -> False
        self.assertFalse(is_overlapping("2026-06-09T14:00:00", "2026-06-09T15:00:00", 
                                        "2026-06-09T15:00:00", "2026-06-09T16:00:00"))

        # 케이스 C: 완전히 다른 시간대
        self.assertFalse(is_overlapping("2026-06-09T10:00:00", "2026-06-09T11:00:00", 
                                        "2026-06-09T14:00:00", "2026-06-09T15:00:00"))

    # --- 2. 회의실 CRUD 및 테넌트(기업) 격리 테스트 ---
    @patch('app.services.meeting_room_service.MeetingRoomRepository')
    def test_create_meeting_room_success(self, room_repo_cls):
        room_repo = room_repo_cls.return_value
        room_repo.insert.return_value = {
            'id': 'room-1',
            'company_id': 'company-A',
            'name': '대회의실 1',
            'location': '3층',
            'capacity': 10
        }

        with self.app.test_request_context():
            result = MeetingRoomService().create({
                'company_id': 'company-A',
                'name': '대회의실 1',
                'location': '3층',
                'capacity': 10
            })

        room_repo.insert.assert_called_once()
        self.assertEqual(result['company_id'], 'company-A')
        self.assertEqual(result['name'], '대회의실 1')

    @patch('app.services.meeting_room_service.MeetingRoomRepository')
    def test_update_meeting_room_other_company_denied(self, room_repo_cls):
        room_repo = room_repo_cls.return_value
        room_repo.find_in_company.return_value = None

        with self.app.test_request_context():
            with self.assertRaises(ApiError) as ctx:
                MeetingRoomService().update('room-other', 'company-A', {'name': '이름 변경'})
            
            self.assertEqual(ctx.exception.status_code, 404)
            self.assertIn("접근 권한이 없습니다", ctx.exception.message)

    # --- 3. 예약 생성 및 중복 예약 검증 테스트 ---
    @patch('app.services.reservation_service.MeetingRoomRepository')
    @patch('app.services.reservation_service.ReservationRepository')
    @patch('app.services.reservation_service.ReservationAttendeeRepository')
    def test_create_reservation_success(self, attendee_repo_cls, reservation_repo_cls, room_repo_cls):
        room_repo = room_repo_cls.return_value
        reservation_repo = reservation_repo_cls.return_value
        
        room_repo.find_in_company.return_value = {'id': 'room-1', 'company_id': 'company-A'}
        reservation_repo.find_active_by_room.return_value = []
        reservation_repo.insert.return_value = {
            'id': 'res-1',
            'company_id': 'company-A',
            'room_id': 'room-1',
            'title': '주간 스크럼',
            'start_at': '2026-06-09T14:00:00Z',
            'end_at': '2026-06-09T15:00:00Z',
            'organizer_id': 'user-1',
            'status': 'RESERVED'
        }

        with self.app.test_request_context():
            result = ReservationService().create('company-A', 'user-1', {
                'room_id': 'room-1',
                'title': '주간 스크럼',
                'start_at': '2026-06-09T14:00:00Z',
                'end_at': '2026-06-09T15:00:00Z',
                'user_ids': ['user-2', 'user-3']
            })

        room_repo.find_in_company.assert_called_once_with('room-1', 'company-A')
        reservation_repo.find_active_by_room.assert_called_once_with('room-1')
        attendee_repo_cls.return_value.insert_attendees.assert_called_once_with('res-1', ['user-2', 'user-3'])
        self.assertEqual(result['status'], 'RESERVED')

    @patch('app.services.reservation_service.MeetingRoomRepository')
    @patch('app.services.reservation_service.ReservationRepository')
    def test_create_reservation_conflict_denied(self, reservation_repo_cls, room_repo_cls):
        room_repo = room_repo_cls.return_value
        reservation_repo = reservation_repo_cls.return_value
        
        room_repo.find_in_company.return_value = {'id': 'room-1', 'company_id': 'company-A'}
        reservation_repo.find_active_by_room.return_value = [
            {'id': 'res-existing', 'start_at': '2026-06-09T14:00:00Z', 'end_at': '2026-06-09T15:00:00Z'}
        ]

        with self.app.test_request_context():
            with self.assertRaises(ApiError) as ctx:
                ReservationService().create('company-A', 'user-1', {
                    'room_id': 'room-1',
                    'title': '팀 미팅',
                    'start_at': '2026-06-09T14:30:00Z',
                    'end_at': '2026-06-09T15:30:00Z'
                })
            
            self.assertEqual(ctx.exception.status_code, 409)
            self.assertIn("이미 다른 예약이 존재합니다", ctx.exception.message)

    @patch('app.services.reservation_service.MeetingRoomRepository')
    @patch('app.services.reservation_service.ReservationRepository')
    def test_create_reservation_other_company_room_denied(self, reservation_repo_cls, room_repo_cls):
        room_repo = room_repo_cls.return_value
        room_repo.find_in_company.return_value = None

        with self.app.test_request_context():
            with self.assertRaises(ApiError) as ctx:
                ReservationService().create('company-A', 'user-1', {
                    'room_id': 'room-other',
                    'title': '외부 미팅',
                    'start_at': '2026-06-09T14:00:00Z',
                    'end_at': '2026-06-09T15:00:00Z'
                })
            
            self.assertEqual(ctx.exception.status_code, 404)
            self.assertIn("회의실을 찾을 수 없거나 접근 권한이 없습니다", ctx.exception.message)

    # --- 4. 예약 취소 (Soft Delete) 테스트 ---
    @patch('app.services.reservation_service.ReservationRepository')
    def test_cancel_reservation_soft_delete(self, reservation_repo_cls):
        reservation_repo = reservation_repo_cls.return_value
        reservation_repo.find_in_company.return_value = {'id': 'res-1', 'company_id': 'company-A', 'status': 'RESERVED'}
        reservation_repo.cancel_in_company.return_value = {'id': 'res-1', 'status': 'CANCELLED'}

        with self.app.test_request_context():
            result = ReservationService().cancel('res-1', 'company-A')
        
        reservation_repo.cancel_in_company.assert_called_once_with('res-1', 'company-A')
        self.assertEqual(result['status'], 'CANCELLED')


if __name__ == '__main__':
    unittest.main()
