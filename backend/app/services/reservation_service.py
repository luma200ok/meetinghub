"""담당: 김승현 — 회의 예약 (중복 검증 / 참석자)"""
from datetime import datetime
from app.repositories.meeting_room_repository import MeetingRoomRepository
from app.repositories.reservation_repository import ReservationRepository, ReservationAttendeeRepository
from app.errors import ApiError


def is_overlapping(s1: str, e1: str, s2: str, e2: str) -> bool:
    """두 시간대 [s1, e1]과 [s2, e2]가 겹치는지 판단"""
    dt_s1 = datetime.fromisoformat(s1.replace('Z', '+00:00'))
    dt_e1 = datetime.fromisoformat(e1.replace('Z', '+00:00'))
    dt_s2 = datetime.fromisoformat(s2.replace('Z', '+00:00'))
    dt_e2 = datetime.fromisoformat(e2.replace('Z', '+00:00'))
    return dt_s1 < dt_e2 and dt_s2 < dt_e1


class ReservationService:
    def __init__(self):
        self.room_repo = MeetingRoomRepository()
        self.reservation_repo = ReservationRepository()
        self.attendee_repo = ReservationAttendeeRepository()

    def list(self, company_id: str) -> list[dict]:
        if not company_id:
            raise ApiError(400, "기업 식별자(company_id)가 필요합니다.")
        return self.reservation_repo.list_in_company(company_id)

    def get(self, reservation_id: str, company_id: str) -> dict:
        reservation = self.reservation_repo.find_in_company(reservation_id, company_id)
        if not reservation:
            raise ApiError(404, "해당 예약을 찾을 수 없거나 권한이 없습니다.")
        
        # 참석자 정보 조인하여 조회
        reservation['attendees'] = self.attendee_repo.find_by_reservation(reservation_id)
        return reservation

    def create(self, company_id: str, organizer_id: str, data: dict) -> dict:
        title = data.get('title')
        room_id = data.get('room_id')
        start_at = data.get('start_at')
        end_at = data.get('end_at')

        if not all([title, room_id, start_at, end_at]):
            raise ApiError(400, "title, room_id, start_at, end_at은 필수 필드입니다.")

        # 타 테넌트 격리 검증: 지정된 room_id가 본인 회사 소속인지 확인
        room = self.room_repo.find_in_company(room_id, company_id)
        if not room:
            raise ApiError(404, "지정된 회의실을 찾을 수 없거나 접근 권한이 없습니다.")

        # 중복 예약 검증
        existing_reservations = self.reservation_repo.find_active_by_room(room_id)
        for row in existing_reservations:
            if is_overlapping(start_at, end_at, row['start_at'], row['end_at']):
                raise ApiError(409, "선택하신 시간대에 이미 다른 예약이 존재합니다.")

        # 예약 생성
        insert_data = {
            'company_id': company_id,
            'room_id': room_id,
            'title': title,
            'start_at': start_at,
            'end_at': end_at,
            'organizer_id': organizer_id,
            'status': 'RESERVED'
        }
        res = self.reservation_repo.insert(insert_data)
        if not res:
            raise ApiError(404, "예약 생성에 실패했습니다.")

        reservation = res

        # data에 user_ids가 있는 경우 참석자 추가
        user_ids = data.get('user_ids', [])
        if user_ids:
            self.attendee_repo.insert_attendees(reservation['id'], user_ids)

        return reservation

    def update(self, reservation_id: str, company_id: str, data: dict) -> dict:
        # 해당 예약이 존재하며 본인 회사 소유인지 먼저 조회
        current_res = self.reservation_repo.find_in_company(reservation_id, company_id)
        if not current_res:
            raise ApiError(404, "해당 예약을 찾을 수 없거나 권한이 없습니다.")
        
        # 업데이트할 데이터 정리
        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title']
        if 'status' in data:
            if data['status'] not in ['RESERVED', 'IN_PROGRESS', 'DONE', 'CANCELLED']:
                raise ApiError(400, "올바르지 않은 예약 상태값입니다.")
            update_data['status'] = data['status']

        start_at = data.get('start_at', current_res['start_at'])
        end_at = data.get('end_at', current_res['end_at'])
        room_id = data.get('room_id', current_res['room_id'])

        # 시간이나 회의실이 변경되는 경우 충돌 및 테넌트 검증
        if 'start_at' in data or 'end_at' in data or 'room_id' in data:
            # 타 테넌트 격리 검증: 변경할 회의실이 소속 회사 회의실인지 검증
            room = self.room_repo.find_in_company(room_id, company_id)
            if not room:
                raise ApiError(404, "지정된 회의실을 찾을 수 없거나 접근 권한이 없습니다.")

            # 중복 예약 검증
            existing_reservations = self.reservation_repo.find_active_by_room(room_id)
            for row in existing_reservations:
                # 본인 예약은 제외
                if row['id'] == reservation_id:
                    continue
                if is_overlapping(start_at, end_at, row['start_at'], row['end_at']):
                    raise ApiError(409, "선택하신 시간대에 이미 다른 예약이 존재합니다.")
            
            update_data['start_at'] = start_at
            update_data['end_at'] = end_at
            update_data['room_id'] = room_id

        # 참석자 목록 업데이트 (선택 사항)
        if 'user_ids' in data:
            # 기존 참석자 삭제 후 새로 인서트
            self.attendee_repo.delete_attendees(reservation_id)
            user_ids = data['user_ids']
            if user_ids:
                self.attendee_repo.insert_attendees(reservation_id, user_ids)

        if not update_data and 'user_ids' not in data:
            raise ApiError(400, "수정할 데이터가 존재하지 않습니다.")

        # 업데이트 적용
        if update_data:
            res = self.reservation_repo.update_in_company(reservation_id, company_id, update_data)
            if not res:
                raise ApiError(404, "예약 수정에 실패했습니다.")
            return res
            
        return self.get(reservation_id, company_id)

    def cancel(self, reservation_id: str, company_id: str) -> dict:
        # 본인 회사 예약 존재 여부 조회
        current_res = self.reservation_repo.find_in_company(reservation_id, company_id)
        if not current_res:
            raise ApiError(404, "해당 예약을 찾을 수 없거나 권한이 없습니다.")
            
        res = self.reservation_repo.cancel_in_company(reservation_id, company_id)
        if not res:
            raise ApiError(404, "예약 취소 처리에 실패했습니다.")
        return res

    def add_attendees(self, reservation_id: str, company_id: str, data: dict) -> dict:
        # 해당 예약이 본인 회사 소유인지 먼저 조회
        current_res = self.reservation_repo.find_in_company(reservation_id, company_id)
        if not current_res:
            raise ApiError(404, "해당 예약을 찾을 수 없거나 권한이 없습니다.")

        user_ids = data.get('user_ids', [])
        if not user_ids:
            raise ApiError(400, "추가할 user_ids가 누락되었습니다.")

        self.attendee_repo.insert_attendees(reservation_id, user_ids)

        # 갱신된 전체 참석자 리스트 반환
        updated_attendees = self.attendee_repo.find_by_reservation(reservation_id)
        return {'reservation_id': reservation_id, 'attendees': updated_attendees}

