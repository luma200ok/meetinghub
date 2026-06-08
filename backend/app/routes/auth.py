from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)
_svc = AuthService()


@auth_bp.post('/signup')
def signup():
    data = request.get_json()
    result = _svc.signup(data['email'], data['password'])
    return jsonify(result), 201


@auth_bp.post('/invite')
def invite():
    data = request.get_json()
    result = _svc.invite(data['email'], data['company_id'])
    return jsonify(result), 201


@auth_bp.post('/invite/accept')
def accept_invite():
    data = request.get_json()
    result = _svc.accept_invite(data['token'], data['password'])
    return jsonify(result), 200
