from app.repositories.base import BaseRepository


class MeetingRoomRepository(BaseRepository):
    table_name = 'meeting_rooms'

    def find_in_company(self, room_id: str, company_id: str) -> dict | None:
        """특정 회사의 특정 회의실 조회"""
        response = self.table.select('*').eq('id', room_id).eq('company_id', company_id).limit(1).execute()
        rows = response.data or []
        return rows[0] if rows else None

    def update_in_company(self, room_id: str, company_id: str, data: dict) -> dict | None:
        """특정 회사의 특정 회의실 정보 수정"""
        response = self.table.update(data).eq('id', room_id).eq('company_id', company_id).execute()
        rows = response.data or []
        return rows[0] if rows else None

    def delete_in_company(self, room_id: str, company_id: str) -> bool:
        """특정 회사의 특정 회의실 삭제"""
        response = self.table.delete().eq('id', room_id).eq('company_id', company_id).execute()
        return bool(response.data)
