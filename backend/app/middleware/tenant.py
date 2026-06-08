from flask import g, jsonify
import functools


def require_company(f):
    """company_id 헤더 필수 — 멀티테넌트 격리"""
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        if not getattr(g, 'company_id', None):
            return jsonify({'error': 'X-Company-Id header required'}), 400
        return f(*args, **kwargs)
    return wrapper
