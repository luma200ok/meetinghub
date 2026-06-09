"""
ai.py
AI 분석 라우트 — OpenAI GPT 연동.
  POST /api/ai/analyze            : 회의록 분석 실행 (요약/핵심/결정/위험)
  POST /api/ai/action-items       : Action Item 자동 생성
  GET  /api/ai/summaries/<id>     : 분석 결과 조회
"""
from flask import Blueprint, request, jsonify
from app.services.ai_service import AiService
from app.middleware.auth import require_auth

ai_bp = Blueprint('ai', __name__)
_svc = AiService()


@ai_bp.post('/analyze')
@require_auth
def analyze():
    """회의록 AI 분석 — 요약 / 핵심논의 / 결정사항 / 위험요소."""
    data = request.get_json(silent=True) or {}
    minute_id = data.get('minute_id')
    if not minute_id:
        return jsonify({'error': 'minute_id는 필수입니다.'}), 400
    result = _svc.analyze(minute_id)
    return jsonify(result), 201


@ai_bp.post('/action-items')
@require_auth
def generate_action_items():
    """회의록 기반 Action Item 자동 생성."""
    data = request.get_json(silent=True) or {}
    minute_id = data.get('minute_id')
    if not minute_id:
        return jsonify({'error': 'minute_id는 필수입니다.'}), 400
    result = _svc.generate_action_items(minute_id)
    return jsonify(result), 201


@ai_bp.get('/summaries/<minute_id>')
@require_auth
def get_summary(minute_id: str):
    """분석 결과 조회. 없으면 null 반환."""
    result = _svc.get_summary(minute_id)
    return jsonify(result)  # None → null
