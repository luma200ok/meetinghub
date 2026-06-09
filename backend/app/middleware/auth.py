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

        # 로그인 한 유저의 company_id를 company_members 테이블에서 조회
        try:
            member_res = sb.table('company_members').select('company_id').eq('user_id', g.user.id).execute()
            if member_res.data:
                g.company_id = member_res.data[0]['company_id']
            else:
                return jsonify({'error': 'No company member association found'}), 403
        except Exception as e:
            return jsonify({'error': 'Failed to verify user company association', 'details': str(e)}), 500

        return f(*args, **kwargs)
    return wrapper
