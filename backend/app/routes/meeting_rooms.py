# 담당: 김승현 — 회의실 관리
from flask import Blueprint, request, jsonify
from app.services.meeting_room_service import MeetingRoomService
from app.middleware.auth import require_auth

meeting_rooms_bp = Blueprint('meeting_rooms', __name__)
_svc = MeetingRoomService()


@meeting_rooms_bp.get('/')
@require_auth
def list_rooms():
    return jsonify(_svc.list())


@meeting_rooms_bp.post('/')
@require_auth
def create_room():
    return jsonify(_svc.create(request.get_json())), 201


@meeting_rooms_bp.put('/<room_id>')
@require_auth
def update_room(room_id: str):
    return jsonify(_svc.update(room_id, request.get_json()))


@meeting_rooms_bp.delete('/<room_id>')
@require_auth
def delete_room(room_id: str):
    _svc.delete(room_id)
    return '', 204
