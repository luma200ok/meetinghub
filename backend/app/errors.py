"""공통 에러 처리.

서비스/라우트에서 `raise ApiError(404, "회의실을 찾을 수 없습니다")` 처럼 던지면
일관된 JSON 응답 `{"error": "..."}` 으로 변환됩니다.
"""
from flask import Flask, jsonify


class ApiError(Exception):
    """비즈니스 예외. status_code와 사용자 메시지를 담는다."""

    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def handle_api_error(e: ApiError):
        return jsonify({'error': e.message}), e.status_code

    @app.errorhandler(404)
    def handle_404(e):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(405)
    def handle_405(e):
        return jsonify({'error': 'Method not allowed'}), 405

    # 예상 못 한 예외 → 프로덕션(gunicorn, debug=False)에서 일관된 JSON 500 반환.
    # debug=True 로컬에서는 Flask 디버거가 우선이라 이 핸들러 대신 스택트레이스가 보임.
    @app.errorhandler(Exception)
    def handle_500(e):
        if app.debug:
            raise e
        return jsonify({'error': 'Internal server error'}), 500
