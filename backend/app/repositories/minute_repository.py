from app.models.meeting import MeetingMinute


class MinuteRepository:
    def list_recent(self, company_id: int) -> list[MeetingMinute]:
        return [
            MeetingMinute(
                id=1,
                reservation_id=1,
                purpose="MVP API 설계 확정",
                content="회의실 예약, 회의록, AI 분석 API 범위를 논의했습니다.",
                decisions="예약 중복 검증과 Action Item 생성을 MVP에 포함합니다.",
                ai_summary="MVP 핵심 흐름은 예약, 회의록, AI 분석, 업무 생성입니다.",
            )
        ]
