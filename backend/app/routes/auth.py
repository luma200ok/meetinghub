from flask import Blueprint, request, jsonify, g
from app.services.auth_service import AuthService
from app.middleware.auth import require_auth
from app.middleware.tenant import require_company

auth_bp = Blueprint('auth', __name__)
_svc = AuthService()


@auth_bp.post('/signup')
def signup():
    data = request.get_json()
    result = _svc.signup(data['email'], data['password'])
    return jsonify(result), 201


@auth_bp.post('/invite')
@require_auth
@require_company
def invite():
    data = request.get_json()
    body_company_id = data.get('company_id')
    if body_company_id and body_company_id != g.company_id:
        raise ValueError('요청 회사와 헤더 회사가 일치하지 않습니다.')

    result = _svc.invite(data['email'], g.company_id)
    return jsonify(result), 201


@auth_bp.post('/invite/accept')
def accept_invite():
    data = request.get_json()
    result = _svc.accept_invite(data['token'], data['password'])
    return jsonify(result), 200
