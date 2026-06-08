# 담당: 김관영 — 기업 생성
from flask import Blueprint, request, jsonify
from app.services.company_service import CompanyService
from app.middleware.auth import require_auth

companies_bp = Blueprint('companies', __name__)
_svc = CompanyService()


@companies_bp.post('/')
@require_auth
def create_company():
    data = request.get_json()
    result = _svc.create(data)
    return jsonify(result), 201


@companies_bp.get('/<company_id>')
@require_auth
def get_company(company_id: str):
    result = _svc.get(company_id)
    return jsonify(result)
