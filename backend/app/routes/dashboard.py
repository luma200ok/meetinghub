# 담당: 정재봉 — 대시보드
from flask import Blueprint, jsonify
from app.services.dashboard_service import DashboardService
from app.middleware.auth import require_auth

dashboard_bp = Blueprint('dashboard', __name__)
_svc = DashboardService()


@dashboard_bp.get('/')
@require_auth
def get_dashboard():
    """오늘 회의 / 내 업무 / 최근 회의 / 회의 통계 / 업무 통계"""
    return jsonify(_svc.get_summary())
