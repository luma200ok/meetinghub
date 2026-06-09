from typing import Optional
from app.repositories.base import BaseRepository
from app.utils.supabase import get_supabase


class MinuteRepository(BaseRepository):
    table_name = "meeting_minutes"

    def find_by_id(self, minute_id: str, company_id: str) -> Optional[dict]:
        """회의록 단건 조회 + company 소속 검증."""
        minute = (
            self.table
            .select("*")
            .eq("id", minute_id)
            .maybe_single()
            .execute()
            .data
        )
        if minute is None:
            return None
        # meeting_reservations 에는 company_id 없음 → meeting_rooms 통해 검증
        if not self.reservation_belongs_to_company(minute["reservation_id"], company_id):
            return None
        return self._enrich(minute)

    def find_by_reservation(self, reservation_id: str) -> Optional[dict]:
        minute = (
            self.table
            .select("*")
            .eq("reservation_id", reservation_id)
            .maybe_single()
            .execute()
            .data
        )
        if minute is None:
            return None
        return self._enrich(minute)

    def list_by_company(self, company_id: str) -> list[dict]:
        sb = get_supabase()

        # 1) 회사 소속 room_ids
        room_ids = [
            r["id"]
            for r in (sb.table("meeting_rooms").select("id").eq("company_id", company_id).execute().data or [])
        ]
        if not room_ids:
            return []

        # 2) 해당 room 의 reservation_ids + 예약 정보 맵
        reservations = (
            sb.table("meeting_reservations")
            .select("id, title, start_at, end_at, room_id")
            .in_("room_id", room_ids)
            .execute()
            .data or []
        )
        res_map = {r["id"]: r for r in reservations}
        if not res_map:
            return []

        # 3) 해당 예약의 회의록 목록
        minutes = (
            self.table
            .select("*")
            .in_("reservation_id", list(res_map.keys()))
            .order("created_at", desc=True)
            .execute()
            .data or []
        )
        if not minutes:
            return []

        # 4) 작성자 이름 일괄 조회 (users 테이블 — user_profiles 아님)
        author_ids = list({m["created_by"] for m in minutes if m.get("created_by")})
        users = (
            sb.table("users").select("id, name").in_("id", author_ids).execute().data or []
        )
        user_map = {u["id"]: u for u in users}

        return [
            {
                **m,
                "author_name": (user_map.get(m.get("created_by")) or {}).get("name"),
                "reservation": res_map.get(m["reservation_id"]),
            }
            for m in minutes
        ]

    def create(self, reservation_id: str, content: str, created_by: str) -> dict:
        return (
            self.table
            .insert({"reservation_id": reservation_id, "content": content, "created_by": created_by})
            .execute()
            .data[0]
        )

    def update(self, minute_id: str, content: str) -> dict:
        return (
            self.table
            .update({"content": content})
            .eq("id", minute_id)
            .execute()
            .data[0]
        )

    def delete(self, minute_id: str) -> None:
        self.table.delete().eq("id", minute_id).execute()

    def exists_for_reservation(self, reservation_id: str) -> bool:
        return (
            self.table
            .select("id")
            .eq("reservation_id", reservation_id)
            .maybe_single()
            .execute()
            .data is not None
        )

    def reservation_belongs_to_company(self, reservation_id: str, company_id: str) -> bool:
        """meeting_reservations 에 company_id 없음 → room_id → meeting_rooms 경유."""
        sb = get_supabase()
        res = (
            sb.table("meeting_reservations")
            .select("room_id")
            .eq("id", reservation_id)
            .maybe_single()
            .execute()
        )
        if res.data is None:
            return False
        room_id = res.data.get("room_id")
        if not room_id:
            return False
        room = (
            sb.table("meeting_rooms")
            .select("id")
            .eq("id", room_id)
            .eq("company_id", company_id)
            .maybe_single()
            .execute()
        )
        return room.data is not None

    # ── 내부 헬퍼 ──────────────────────────────────────────────────────────────

    def _enrich(self, minute: dict) -> dict:
        """users 테이블에서 작성자 이름 조회해 author_name 필드로 추가."""
        sb = get_supabase()
        author = None
        if minute.get("created_by"):
            author_res = (
                sb.table("users")
                .select("name")
                .eq("id", minute["created_by"])
                .maybe_single()
                .execute()
            )
            author = author_res.data
        return {
            **minute,
            "author_name": author.get("name") if author else None,
        }
