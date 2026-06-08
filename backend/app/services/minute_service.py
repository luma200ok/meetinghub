"""담당: 허남 — 회의록 작성/조회"""


class MinuteService:
    def list(self) -> list[dict]:
        raise NotImplementedError

    def create(self, data: dict) -> dict:
        raise NotImplementedError

    def get(self, minute_id: str) -> dict:
        raise NotImplementedError

    def update(self, minute_id: str, data: dict) -> dict:
        raise NotImplementedError
