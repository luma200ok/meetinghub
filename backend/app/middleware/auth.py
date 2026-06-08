import functools
from flask import request, jsonify, g
from app.utils.supabase import get_supabase


def require_auth(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization', '').removeprefix('Bearer ').strip()
        if not token:
            return jsonify({'error': 'Unauthorized'}), 401

        sb = get_supabase()
        # 잘못된/만료된 토큰은 get_user가 예외를 던지므로 잡아서 401로 변환
        try:
            user_response = sb.auth.get_user(token)
        except Exception:
            return jsonify({'error': 'Invalid token'}), 401

        if user_response is None or user_response.user is None:
            return jsonify({'error': 'Invalid token'}), 401

        g.user = user_response.user
        g.company_id = request.headers.get('X-Company-Id')
        return f(*args, **kwargs)
    return wrapper
