"""담당: 김승현 — 회의 예약 및 참석자 데이터 저장소"""
from app.repositories.base import BaseRepository


class ReservationRepository(BaseRepository):
    table_name = 'meeting_reservations'

    def find_in_company(self, reservation_id: str, company_id: str) -> dict | None:
        """특정 기업(company_id)에 속한 예약 상세 정보를 조회합니다."""
        response = (
            self.table.select('*')
            .eq('id', reservation_id)
            .eq('company_id', company_id)
            .limit(1)
            .execute()
        )
        rows = response.data or []
        return rows[0] if rows else None

    def list_in_company(self, company_id: str) -> list[dict]:
        """특정 기업에 속한 모든 예약 목록을 조회합니다."""
        response = (
            self.table.select('*')
            .eq('company_id', company_id)
            .execute()
        )
        return response.data or []

    def find_active_by_room(self, room_id: str) -> list[dict]:
        """중복 예약을 검증하기 위해 특정 회의실의 활성화된(예약됨/진행중) 예약 시간대를 조회합니다."""
        response = (
            self.table.select('id, start_at, end_at')
            .eq('room_id', room_id)
            .in_('status', ['RESERVED', 'IN_PROGRESS'])
            .execute()
        )
        return response.data or []

    def update_in_company(self, reservation_id: str, company_id: str, data: dict) -> dict:
        """특정 기업에 속한 예약 정보를 업데이트합니다."""
        response = (
            self.table.update(data)
            .eq('id', reservation_id)
            .eq('company_id', company_id)
            .execute()
        )
        rows = response.data or []
        return rows[0] if rows else {}

    def cancel_in_company(self, reservation_id: str, company_id: str) -> dict:
        """예약을 취소(Soft Delete) 상태로 변경합니다."""
        return self.update_in_company(reservation_id, company_id, {'status': 'CANCELLED'})


class ReservationAttendeeRepository(BaseRepository):
    table_name = 'reservation_attendees'

    def find_by_reservation(self, reservation_id: str) -> list[dict]:
        """특정 예약에 속한 참석자 목록(사용자 이메일, 이름 조인)을 조회합니다."""
        response = (
            self.table.select('user_id, users(email, name)')
            .eq('reservation_id', reservation_id)
            .execute()
        )
        return response.data or []

    def insert_attendees(self, reservation_id: str, user_ids: list[str]) -> list[dict]:
        """예약에 참석자 리스트를 일괄 추가합니다. 중복 입력을 사전에 걸러 안전하게 처리합니다."""
        # 1. Python 단에서 중복 user_id 제거
        unique_user_ids = list(set(user_ids))
        if not unique_user_ids:
            return []

        # 2. DB에 이미 존재하는 참석자 조회
        existing_res = (
            self.table.select('user_id')
            .eq('reservation_id', reservation_id)
            .execute()
        )
        existing_uids = {row['user_id'] for row in existing_res.data or []}

        # 3. 중복되지 않은 신규 참석자 행 빌드
        insert_rows = [
            {'reservation_id': reservation_id, 'user_id': uid}
            for uid in unique_user_ids
            if uid not in existing_uids
        ]

        # 4. 일괄 추가
        if not insert_rows:
            return []

        response = self.table.insert(insert_rows).execute()
        return response.data or []

    def delete_attendees(self, reservation_id: str) -> None:
        """특정 예약의 모든 참석자를 삭제합니다 (예약 삭제 또는 참석자 명단 덮어쓰기 시 사용)."""
        self.table.delete().eq('reservation_id', reservation_id).execute()
