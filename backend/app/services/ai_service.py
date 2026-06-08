"""담당: 이은석 — AI 분석 (GPT 연동)"""


class AiService:
    def analyze(self, minute_id: str) -> dict:
        # TODO: 회의록 본문 → GPT 호출 → 요약/핵심논의/결정사항/위험요소 → ai_summaries 저장
        raise NotImplementedError

    def generate_action_items(self, minute_id: str) -> list[dict]:
        # TODO: 회의록 → GPT → 담당자/업무/마감일 추출 → action_items 저장
        raise NotImplementedError

    def get_summary(self, minute_id: str) -> dict:
        raise NotImplementedError
