# 담당: 김승현 — 회의 예약 (중복 검증, 참석자)
from flask import Blueprint, request, jsonify
from app.services.reservation_service import ReservationService
from app.middleware.auth import require_auth

reservations_bp = Blueprint('reservations', __name__)
_svc = ReservationService()


@reservations_bp.get('/')
@require_auth
def list_reservations():
    return jsonify(_svc.list())


@reservations_bp.post('/')
@require_auth
def create_reservation():
    return jsonify(_svc.create(request.get_json())), 201


@reservations_bp.get('/<reservation_id>')
@require_auth
def get_reservation(reservation_id: str):
    return jsonify(_svc.get(reservation_id))


@reservations_bp.put('/<reservation_id>')
@require_auth
def update_reservation(reservation_id: str):
    return jsonify(_svc.update(reservation_id, request.get_json()))


@reservations_bp.delete('/<reservation_id>')
@require_auth
def cancel_reservation(reservation_id: str):
    return jsonify(_svc.cancel(reservation_id))


@reservations_bp.post('/<reservation_id>/attendees')
@require_auth
def add_attendees(reservation_id: str):
    return jsonify(_svc.add_attendees(reservation_id, request.get_json())), 201
