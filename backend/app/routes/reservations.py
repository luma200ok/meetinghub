# 담당: 김승현 — 회의 예약 (중복 검증, 참석자)
from flask import Blueprint, request, jsonify
from app.services.reservation_service import ReservationService
from app.middleware.auth import require_auth

reservations_bp = Blueprint('reservations', __name__)
_svc = ReservationService()


@reservations_bp.get('/')
@require_auth
def list_reservations():
    from flask import g
    return jsonify(_svc.list(g.company_id))


@reservations_bp.post('/')
@require_auth
def create_reservation():
    from flask import g
    return jsonify(_svc.create(g.company_id, g.user.id, request.get_json() or {})), 201


@reservations_bp.get('/<reservation_id>')
@require_auth
def get_reservation(reservation_id: str):
    from flask import g
    return jsonify(_svc.get(reservation_id, g.company_id))


@reservations_bp.put('/<reservation_id>')
@require_auth
def update_reservation(reservation_id: str):
    from flask import g
    return jsonify(_svc.update(reservation_id, g.company_id, request.get_json() or {}))


@reservations_bp.delete('/<reservation_id>')
@require_auth
def cancel_reservation(reservation_id: str):
    from flask import g
    return jsonify(_svc.cancel(reservation_id, g.company_id))


@reservations_bp.post('/<reservation_id>/attendees')
@require_auth
def add_attendees(reservation_id: str):
    from flask import g
    return jsonify(_svc.add_attendees(reservation_id, g.company_id, request.get_json() or {})), 201
