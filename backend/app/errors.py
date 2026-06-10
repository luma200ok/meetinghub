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

    @app.errorhandler(ValueError)
    def handle_bad_request(error: ValueError):
        return jsonify({'error': str(error)}), 400

    @app.errorhandler(KeyError)
    def handle_missing_field(error: KeyError):
        return jsonify({'error': f'{error.args[0]} 필드가 필요합니다.'}), 400

    @app.errorhandler(PermissionError)
    def handle_forbidden(error: PermissionError):
        return jsonify({'error': str(error)}), 403

    @app.errorhandler(LookupError)
    def handle_not_found(error: LookupError):
        return jsonify({'error': str(error)}), 404

    @app.errorhandler(404)
    def handle_404(e):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(405)
    def handle_405(e):
        return jsonify({'error': 'Method not allowed'}), 405

    # Supabase/PostgREST DB 오류(insert/update/select 실패 등) → 실제 메시지 노출.
    # 기존엔 generic Exception 핸들러에 잡혀 'Internal server error'로 묻혀, 회의록 저장 500
    # 같은 문제의 원인이 클라이언트/로그에서 안 보이던 것을 해소한다.
    try:
        from postgrest.exceptions import APIError as _PostgrestAPIError
    except Exception:  # pragma: no cover - 버전에 따라 경로가 다를 수 있음
        _PostgrestAPIError = None

    if _PostgrestAPIError is not None:
        @app.errorhandler(_PostgrestAPIError)
        def handle_postgrest_error(e):
            detail = getattr(e, 'message', None) or str(e)
            code = getattr(e, 'code', None)
            app.logger.error(
                'PostgREST error code=%s message=%s details=%s hint=%s',
                code, detail, getattr(e, 'details', None), getattr(e, 'hint', None),
            )
            return jsonify({'error': f'DB 오류: {detail}'}), 400

    # 예상 못 한 예외 → 프로덕션(gunicorn, debug=False)에서 일관된 JSON 500 반환.
    # debug=True 로컬에서는 Flask 디버거가 우선이라 이 핸들러 대신 스택트레이스가 보임.
    @app.errorhandler(Exception)
    def handle_500(e):
        if app.debug:
            raise e
        # 예외 스택을 로그로 남긴다(기존엔 조용히 삼켜 Render 로그에 traceback이 안 남던 버그).
        app.logger.exception('Unhandled exception')
        # 진단 보조: 예외 타입/메시지를 응답에 포함해 클라이언트에서도 원인 파악 가능하게 한다.
        return jsonify({
            'error': 'Internal server error',
            'detail': f'{type(e).__name__}: {e}',
        }), 500
