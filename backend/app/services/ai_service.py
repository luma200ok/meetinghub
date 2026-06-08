from app.repositories.minute_repository import MinuteRepository


class AIService:
    def __init__(self):
        self.minute_repository = MinuteRepository()

    def get_recent_minutes(self, company_id: int):
        return self.minute_repository.list_recent(company_id)

    def build_analysis_prompt(self, minute_text: str) -> str:
        return (
            "다음 회의록에서 전체 요약, 핵심 논의, 결정 사항, 위험 요소, "
            "Action Item을 JSON으로 추출하세요.\n\n"
            f"{minute_text}"
        )
