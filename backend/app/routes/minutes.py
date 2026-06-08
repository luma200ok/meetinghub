# 담당: 허남 — 회의록 작성/조회
from flask import Blueprint, request, jsonify
from app.services.minute_service import MinuteService
from app.middleware.auth import require_auth

minutes_bp = Blueprint('minutes', __name__)
_svc = MinuteService()


@minutes_bp.get('/')
@require_auth
def list_minutes():
    return jsonify(_svc.list())


@minutes_bp.post('/')
@require_auth
def create_minute():
    return jsonify(_svc.create(request.get_json())), 201


@minutes_bp.get('/<minute_id>')
@require_auth
def get_minute(minute_id: str):
    return jsonify(_svc.get(minute_id))


@minutes_bp.put('/<minute_id>')
@require_auth
def update_minute(minute_id: str):
    return jsonify(_svc.update(minute_id, request.get_json()))
