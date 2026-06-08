# 담당: 김관영 — 기업 생성
from flask import Blueprint, request, jsonify, g
from app.services.company_service import CompanyService
from app.middleware.auth import require_auth
from app.middleware.tenant import require_company

companies_bp = Blueprint('companies', __name__)
_svc = CompanyService()


@companies_bp.post('')
@require_auth
def create_company():
    data = request.get_json()
    result = _svc.create(data)
    return jsonify(result), 201


@companies_bp.get('/<company_id>')
@require_auth
@require_company
def get_company(company_id: str):
    if company_id != g.company_id:
        raise ValueError('요청 회사와 헤더 회사가 일치하지 않습니다.')

    result = _svc.get(company_id)
    return jsonify(result)
