"""
minutes.py
회의록 CRUD 라우트.
ApiError 는 전역 핸들러가 처리하므로 try/except 불필요.
"""
from flask import Blueprint, request, jsonify
from app.services.minute_service import MinuteService
from app.middleware.auth import require_auth

minutes_bp = Blueprint("minutes", __name__)
_svc = MinuteService()


@minutes_bp.route("", methods=["GET"])
@require_auth
def list_minutes():
    return jsonify(_svc.list())


@minutes_bp.route("/<minute_id>", methods=["GET"])
@require_auth
def get_minute(minute_id: str):
    return jsonify(_svc.get(minute_id))


@minutes_bp.route("/by-reservation/<reservation_id>", methods=["GET"])
@require_auth
def get_by_reservation(reservation_id: str):
    return jsonify(_svc.get_by_reservation(reservation_id))


@minutes_bp.route("", methods=["POST"])
@require_auth
def create_minute():
    return jsonify(_svc.create(request.get_json(silent=True) or {})), 201


@minutes_bp.route("/<minute_id>", methods=["PUT"])
@require_auth
def update_minute(minute_id: str):
    return jsonify(_svc.update(minute_id, request.get_json(silent=True) or {}))


@minutes_bp.route("/<minute_id>", methods=["DELETE"])
@require_auth
def delete_minute(minute_id: str):
    _svc.delete(minute_id)
    return "", 204
