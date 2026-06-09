"""담당: 김승현 — 회의실 관리"""
from app.repositories.meeting_room_repository import MeetingRoomRepository
from app.errors import ApiError
from app.services.tenant_guard import require_member_company


class MeetingRoomService:
    def __init__(self):
        self.repo = MeetingRoomRepository()

    def list(self, company_id=None) -> list[dict]:
        company_id = require_member_company()
        return self.repo.find_all(company_id)

    def create(self, data: dict) -> dict:
        company_id = require_member_company()
        if not data.get('name'):
            raise ApiError(400, "회의실 이름(name)은 필수입니다.")
        
        insert_data = {
            'company_id': company_id,
            'name': data['name'],
            'location': data.get('location'),
            'capacity': data.get('capacity')
        }
        row = self.repo.insert(insert_data)
        if not row:
            raise ApiError(404, "회의실 생성에 실패했습니다.")
        return row

    def update(self, room_id: str, company_id: str, data: dict) -> dict:
        company_id = require_member_company()
        # 수정 가능한 필드 제한
        update_data = {}
        if 'name' in data:
            if not data['name']:
                raise ApiError(400, "회의실 이름은 비워둘 수 없습니다.")
            update_data['name'] = data['name']
        if 'location' in data:
            update_data['location'] = data['location']
        if 'capacity' in data:
            update_data['capacity'] = data['capacity']

        if not update_data:
            raise ApiError(400, "수정할 데이터가 존재하지 않습니다.")

        # 해당 회의실이 소속 회사 자원인지 확인
        room = self.repo.find_in_company(room_id, company_id)
        if not room:
            raise ApiError(404, "해당 회의실을 찾을 수 없거나 접근 권한이 없습니다.")

        updated_row = self.repo.update_in_company(room_id, company_id, update_data)
        if not updated_row:
            raise ApiError(404, "회의실 수정에 실패했습니다.")
        return updated_row

    def delete(self, room_id: str, company_id: str) -> None:
        company_id = require_member_company()
        # 해당 회의실이 소속 회사 자원인지 확인
        room = self.repo.find_in_company(room_id, company_id)
        if not room:
            raise ApiError(404, "해당 회의실을 찾을 수 없거나 접근 권한이 없습니다.")

        deleted = self.repo.delete_in_company(room_id, company_id)
        if not deleted:
            raise ApiError(404, "회의실 삭제에 실패했습니다.")


