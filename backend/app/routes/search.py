# 담당: 정재봉 — 통합 검색
from flask import Blueprint, request, jsonify
from app.services.search_service import SearchService
from app.middleware.auth import require_auth
from app.middleware.tenant import require_company

search_bp = Blueprint('search', __name__)
_svc = SearchService()


@search_bp.get('')
@require_auth
@require_company
def search():
    """q 파라미터로 회의 / 회의록 / 업무 / 예약 통합 검색"""
    q = request.args.get('q', '')
    return jsonify(_svc.search(q))
