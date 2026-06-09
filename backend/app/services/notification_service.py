from flask import g
from app.utils.supabase import get_supabase


class NotificationService:

    # 앞에 _가 붙은 메서드는 클래스 내부에서만 사용하는 보조 메서드라는 의미
    # 현재 로그인한 사용자 정보를 g.user에서 가져와 user_id를 반환함  
    def _get_current_user_id(self) -> str:
        # g.user가 없으면 인증되지 않은 요청이므로 401 에러 반환
        if not hasattr(g, "user") or g.user is None:
            raise PermissionError("로그인 사용자 정보를 찾을 수 없습니다.")

        # g.user 객체에서 id 값을 안전하게 가져옴
        user_id = getattr(g.user, "id", None)

        # user_id가 없으면 알림 조회/읽음 처리를 할 수 없으므로 403 에러 반환
        if not user_id:
            raise PermissionError("user_id를 찾을 수 없습니다.")

        return user_id


    # 현재 로그인한 사용자의 알림 목록을 조회하는 메서드
    # Supabase에서 notifications 테이블을 조회하고, user_id가 현재 사용자와 일치하는 알림만 가져옴
    # 반환값은 알림 정보(dict)들이 담긴 list 형태
    def list(self) -> list[dict]:
        user_id = self._get_current_user_id()
        supabase = get_supabase()

        response = (
            supabase
            .table("notifications")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        return response.data


    # 특정 알림을 읽음 처리하는 메서드
    # notification_id를 받아 해당 알림의 is_read 값을 True로 변경
    # Supabase에서 해당 알림을 찾고(user_id로 확인하여), is_read를 True로 업데이트
    # 반환값은 업데이트된 알림 정보(dict) 형태
    def mark_read(self, notification_id: str) -> dict:
        user_id = self._get_current_user_id()
        supabase = get_supabase()

        response = (
            supabase
            .table("notifications")
            .update({"is_read": True})
            .eq("id", notification_id)
            .eq("user_id", user_id)
            .execute()
        )
        # 업데이트된 알림 데이터가 있으면 첫 번째 데이터를 반환하고,
        # 없으면 빈 딕셔너리 {}를 반환한다
        return response.data[0] if response.data else {}



    # 현재 로그인한 사용자의 읽지 않은 알림을 모두 읽음 처리하는 메서드
    # user_id가 현재 사용자와 일치하고, is_read가 False인 알림만 True로 변경
    # 반환값은 읽음 처리된 개수와 업데이트된 알림 목록(dict)
    def mark_all_read(self) -> dict:
        user_id = self._get_current_user_id()
        supabase = get_supabase()

        response = (
            supabase
            .table("notifications")
            .update({"is_read": True})
            .eq("user_id", user_id)
            .eq("is_read", False)
            .execute()
        )

        return {
            # 이번 요청으로 읽음 처리된 알림 개수
            "updated_count": len(response.data),

            # 모두 읽음 처리 후 남은 안 읽은 알림 개수
            "unread_count": 0,

            # 실제로 읽음 처리된 알림 목록
            "notifications": response.data,
        }

        # 단 typescript에서 
        # const result = await markAllRead();
        # setUnreadCount(result.unread_count);
        # 이 코드를 추가하여야 보이는 화면에서도 '0'으로 보임
        