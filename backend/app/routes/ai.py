# 담당: 이은석 — AI 분석 (GPT 연동, 요약, 결정사항, Action Item)
from flask import Blueprint, request, jsonify
from app.services.ai_service import AiService
from app.middleware.auth import require_auth

ai_bp = Blueprint('ai', __name__)
_svc = AiService()


@ai_bp.post('/analyze')
@require_auth
def analyze():
    """회의록 AI 분석 — 요약 / 핵심논의 / 결정사항 / 위험요소"""
    data = request.get_json()
    result = _svc.analyze(data['minute_id'])
    return jsonify(result), 201


@ai_bp.post('/action-items')
@require_auth
def generate_action_items():
    """회의록 기반 Action Item 자동 생성"""
    data = request.get_json()
    result = _svc.generate_action_items(data['minute_id'])
    return jsonify(result), 201


@ai_bp.get('/summaries/<minute_id>')
@require_auth
def get_summary(minute_id: str):
    return jsonify(_svc.get_summary(minute_id))
