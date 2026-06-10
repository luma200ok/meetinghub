from typing import Optional
from app.repositories.base import BaseRepository
from app.utils.supabase import get_supabase, single_or_none


class MinuteRepository(BaseRepository):
    table_name = "meeting_minutes"

    def find_by_id(self, minute_id: str, company_id: str) -> Optional[dict]:
        """회의록 단건 조회 + company 소속 검증."""
        minute = single_or_none(
            self.table.select("*").eq("id", minute_id).maybe_single()
        )
        if minute is None:
            return None
        # meeting_reservations 에는 company_id 없음 → meeting_rooms 통해 검증
        if not self.reservation_belongs_to_company(minute["reservation_id"], company_id):
            return None
        return self._enrich(minute)

    def find_by_reservation(self, reservation_id: str) -> Optional[dict]:
        minute = single_or_none(
            self.table.select("*").eq("reservation_id", reservation_id).maybe_single()
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

        # 4) 작성자 표시명 일괄 조회 (이름 없으면 이메일로 — UUID 노출 방지)
        author_ids = list({m["created_by"] for m in minutes if m.get("created_by")})
        users = (
            sb.table("users").select("id, name, email").in_("id", author_ids).execute().data or []
        )
        user_map = {u["id"]: u for u in users}

        def _author(u):
            return (u.get("name") or u.get("email")) if u else None

        return [
            {
                **m,
                "author_name": _author(user_map.get(m.get("created_by"))),
                "reservation": res_map.get(m["reservation_id"]),
            }
            for m in minutes
        ]

    def create(self, reservation_id: str, content: str, created_by: str, company_id: str) -> dict:
        rows = (
            self.table
            .insert({
                "reservation_id": reservation_id,
                "content": content,
                "created_by": created_by,
                "company_id": company_id,
            })
            .execute()
            .data
        ) or []
        if not rows:
            # insert 가 빈 응답을 주면 기존엔 .data[0] 에서 IndexError(=generic 500)가 났다.
            from app.errors import ApiError
            raise ApiError(500, "회의록 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.")
        return self._enrich(rows[0])

    def update(self, minute_id: str, content: str) -> dict:
        rows = (
            self.table
            .update({"content": content})
            .eq("id", minute_id)
            .execute()
            .data
        ) or []
        if not rows:
            from app.errors import ApiError
            raise ApiError(404, "회의록을 찾을 수 없습니다.")
        return self._enrich(rows[0])

    def delete(self, minute_id: str) -> None:
        self.table.delete().eq("id", minute_id).execute()

    def exists_for_reservation(self, reservation_id: str) -> bool:
        return single_or_none(
            self.table.select("id").eq("reservation_id", reservation_id).maybe_single()
        ) is not None

    def reservation_belongs_to_company(self, reservation_id: str, company_id: str) -> bool:
        """meeting_reservations 에 company_id 없음 → room_id → meeting_rooms 경유."""
        sb = get_supabase()
        res = single_or_none(
            sb.table("meeting_reservations").select("room_id").eq("id", reservation_id).maybe_single()
        )
        if res is None:
            return False
        room_id = res.get("room_id")
        if not room_id:
            return False
        room = single_or_none(
            sb.table("meeting_rooms").select("id").eq("id", room_id).eq("company_id", company_id).maybe_single()
        )
        return room is not None

    # ── 내부 헬퍼 ──────────────────────────────────────────────────────────────

    def _enrich(self, minute: dict) -> dict:
        """작성자 표시명을 author_name 으로 추가. 이름 없으면 이메일로(UUID 노출 방지)."""
        sb = get_supabase()
        author = None
        if minute.get("created_by"):
            author = single_or_none(
                sb.table("users").select("name, email").eq("id", minute["created_by"]).maybe_single()
            )
        return {
            **minute,
            "author_name": (author.get("name") or author.get("email")) if author else None,
        }
