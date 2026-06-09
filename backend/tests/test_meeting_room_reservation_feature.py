"""담당: 김승현 — 회의실 및 예약 핵심 비즈니스 로직 단위 테스트"""
from contextlib import contextmanager
import unittest
from unittest.mock import Mock, patch
from types import SimpleNamespace
from flask import Flask, g

from app.services.meeting_room_service import MeetingRoomService
from app.services.reservation_service import ReservationService, is_overlapping
from app.errors import ApiError


def _member(member_cls, role='MEMBER'):
    """CompanyMemberRepository를 구성원으로 모킹"""
    inst = member_cls.return_value
    inst.find_by_user_company.return_value = {'id': 'm', 'role': role}
    inst.role_for.return_value = role
    return inst


class MeetingRoomReservationFeatureTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)

    @contextmanager
    def _ctx(self, user_id='user-1', company_id='company-A'):
        with self.app.test_request_context():
            g.user = SimpleNamespace(id=user_id)
            g.company_id = company_id
            yield

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
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_create_meeting_room_success(self, member_cls, room_repo_cls):
        _member(member_cls)
        room_repo = room_repo_cls.return_value
        room_repo.insert.return_value = {
            'id': 'room-1',
            'company_id': 'company-A',
            'name': '대회의실 1',
            'location': '3층',
            'capacity': 10
        }

        with self._ctx():
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
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_update_meeting_room_other_company_denied(self, member_cls, room_repo_cls):
        _member(member_cls)
        room_repo = room_repo_cls.return_value
        room_repo.find_in_company.return_value = None

        with self._ctx():
            with self.assertRaises(ApiError) as ctx:
                MeetingRoomService().update('room-other', 'company-A', {'name': '이름 변경'})
            
            self.assertEqual(ctx.exception.status_code, 404)
            self.assertIn("접근 권한이 없습니다", ctx.exception.message)

    # --- 3. 예약 생성 및 중복 예약 검증 테스트 ---
    @patch('app.services.reservation_service.MeetingRoomRepository')
    @patch('app.services.reservation_service.ReservationRepository')
    @patch('app.services.reservation_service.ReservationAttendeeRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_create_reservation_success(self, member_cls, attendee_repo_cls, reservation_repo_cls, room_repo_cls):
        _member(member_cls)
        room_repo = room_repo_cls.return_value
        reservation_repo = reservation_repo_cls.return_value
        
        room_repo.find_in_company.return_value = {'id': 'room-1', 'company_id': 'company-A'}
        reservation_repo.find_active_by_room.return_value = []
        reservation_repo.insert.return_value = {
            'id': 'res-1',
            'company_id': 'company-A',
            'room_id': 'room-1',
            'title': '주간 스크럼',
            'start_at': '2026-06-09T14:00:00+00:00',
            'end_at': '2026-06-09T15:00:00+00:00',
            'organizer_id': 'user-1',
            'status': 'RESERVED'
        }

        with self._ctx():
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
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_create_reservation_conflict_denied(self, member_cls, reservation_repo_cls, room_repo_cls):
        _member(member_cls)
        room_repo = room_repo_cls.return_value
        reservation_repo = reservation_repo_cls.return_value
        
        room_repo.find_in_company.return_value = {'id': 'room-1', 'company_id': 'company-A'}
        reservation_repo.find_active_by_room.return_value = [
            {'id': 'res-existing', 'start_at': '2026-06-09T14:00:00Z', 'end_at': '2026-06-09T15:00:00Z'}
        ]

        with self._ctx():
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
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_create_reservation_other_company_room_denied(self, member_cls, reservation_repo_cls, room_repo_cls):
        _member(member_cls)
        room_repo = room_repo_cls.return_value
        room_repo.find_in_company.return_value = None

        with self._ctx():
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
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_cancel_reservation_soft_delete(self, member_cls, reservation_repo_cls):
        _member(member_cls)
        reservation_repo = reservation_repo_cls.return_value
        reservation_repo.find_in_company.return_value = {'id': 'res-1', 'company_id': 'company-A', 'status': 'RESERVED'}
        reservation_repo.cancel_in_company.return_value = {'id': 'res-1', 'status': 'CANCELLED'}

        with self._ctx():
            result = ReservationService().cancel('res-1', 'company-A')
        
        reservation_repo.cancel_in_company.assert_called_once_with('res-1', 'company-A')
        self.assertEqual(result['status'], 'CANCELLED')

    # --- 5. P1-1: 타 회사 자원 차단 (cross-tenant) 테스트 ---
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_cross_tenant_access_denied(self, member_cls):
        # 사용자가 해당 회사의 구성원이 아니라고 가정 (None 리턴)
        member_cls.return_value.find_by_user_company.return_value = None

        with self._ctx(user_id='user-attacker', company_id='company-victim'):
            # 회의실 목록 조회 차단
            with self.assertRaises(PermissionError):
                MeetingRoomService().list('company-victim')
            
            # 예약 생성 차단
            with self.assertRaises(PermissionError):
                ReservationService().create('company-victim', 'user-attacker', {
                    'room_id': 'room-1',
                    'title': '해킹 미팅',
                    'start_at': '2026-06-09T14:00:00Z',
                    'end_at': '2026-06-09T15:00:00Z'
                })

    # --- 6. P1-2: 참석자에 타사 사용자 주입 방어 테스트 ---
    @patch('app.services.reservation_service.MeetingRoomRepository')
    @patch('app.services.reservation_service.ReservationRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_add_outsider_attendee_denied(self, member_cls, reservation_repo_cls, room_repo_cls):
        # attacker가 target_user를 추가하려고 함.
        # target_user가 구성원인지 확인할 때 find_by_user_company가 None을 반환하게 설정
        inst = member_cls.return_value
        inst.find_by_user_company.side_effect = (
            lambda user_id, company_id: {'id': 'm', 'role': 'MEMBER'} if user_id == 'user-attacker' else None
        )
        
        room_repo = room_repo_cls.return_value
        room_repo.find_in_company.return_value = {'id': 'room-1', 'company_id': 'company-A'}
        
        with self._ctx(user_id='user-attacker', company_id='company-A'):
            # 예약 생성 시 비구성원 포함 거부
            with self.assertRaises(ApiError) as ctx:
                ReservationService().create('company-A', 'user-attacker', {
                    'room_id': 'room-1',
                    'title': '비구성원 초대 미팅',
                    'start_at': '2026-06-09T14:00:00Z',
                    'end_at': '2026-06-09T15:00:00Z',
                    'user_ids': ['outsider-user']
                })
            self.assertEqual(ctx.exception.status_code, 400)
            self.assertIn("해당 회사의 구성원만 참석자로 지정할 수 있습니다", ctx.exception.message)

    # --- 7. P1-3: 시간 역전(start_at >= end_at) 검증 테스트 ---
    @patch('app.services.reservation_service.MeetingRoomRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_invalid_time_range_denied(self, member_cls, room_repo_cls):
        _member(member_cls)
        room_repo = room_repo_cls.return_value
        room_repo.find_in_company.return_value = {'id': 'room-1', 'company_id': 'company-A'}

        with self._ctx():
            # start_at > end_at
            with self.assertRaises(ApiError) as ctx1:
                ReservationService().create('company-A', 'user-1', {
                    'room_id': 'room-1',
                    'title': '역전 시간 미팅',
                    'start_at': '2026-06-09T15:00:00Z',
                    'end_at': '2026-06-09T14:00:00Z'
                })
            self.assertEqual(ctx1.exception.status_code, 400)
            self.assertIn("시작 시간은 종료 시간보다 빨라야 합니다", ctx1.exception.message)

            # start_at == end_at
            with self.assertRaises(ApiError) as ctx2:
                ReservationService().create('company-A', 'user-1', {
                    'room_id': 'room-1',
                    'title': '동일 시간 미팅',
                    'start_at': '2026-06-09T14:00:00Z',
                    'end_at': '2026-06-09T14:00:00Z'
                })
            self.assertEqual(ctx2.exception.status_code, 400)
            self.assertIn("시작 시간은 종료 시간보다 빨라야 합니다", ctx2.exception.message)

    # --- 8. P2: naive datetime 타임존 자동 보정 테스트 ---
    @patch('app.services.reservation_service.MeetingRoomRepository')
    @patch('app.services.reservation_service.ReservationRepository')
    @patch('app.services.tenant_guard.CompanyMemberRepository')
    def test_naive_datetime_normalization(self, member_cls, reservation_repo_cls, room_repo_cls):
        _member(member_cls)
        room_repo = room_repo_cls.return_value
        room_repo.find_in_company.return_value = {'id': 'room-1', 'company_id': 'company-A'}
        
        reservation_repo = reservation_repo_cls.return_value
        reservation_repo.find_active_by_room.return_value = []
        reservation_repo.insert.return_value = {
            'id': 'res-naive',
            'status': 'RESERVED'
        }

        with self._ctx():
            # 타임존 정보가 없는 naive ISO 포맷 전송
            ReservationService().create('company-A', 'user-1', {
                'room_id': 'room-1',
                'title': '타임존 보정 테스트',
                'start_at': '2026-06-09T14:00:00',
                'end_at': '2026-06-09T15:00:00'
            })
            
            # DB insert 시 target 시간 문자열이 '+00:00'(UTC) 타임존이 포함된 상태로 변환되어 전달되었는지 확인
            called_data = reservation_repo.insert.call_args[0][0]
            self.assertEqual(called_data['start_at'], '2026-06-09T14:00:00+00:00')
            self.assertEqual(called_data['end_at'], '2026-06-09T15:00:00+00:00')


if __name__ == '__main__':
    unittest.main()
