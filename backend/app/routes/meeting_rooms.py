# 담당: 김승현 — 회의실 관리
from flask import Blueprint, request, jsonify
from app.services.meeting_room_service import MeetingRoomService
from app.middleware.auth import require_auth

meeting_rooms_bp = Blueprint('meeting_rooms', __name__)
_svc = MeetingRoomService()


@meeting_rooms_bp.get('/')
@require_auth
def list_rooms():
    from flask import g
    return jsonify(_svc.list(g.company_id))


@meeting_rooms_bp.post('/')
@require_auth
def create_room():
    from flask import g
    data = request.get_json() or {}
    data['company_id'] = g.company_id
    return jsonify(_svc.create(data)), 201


@meeting_rooms_bp.put('/<room_id>')
@require_auth
def update_room(room_id: str):
    from flask import g
    return jsonify(_svc.update(room_id, g.company_id, request.get_json() or {}))


@meeting_rooms_bp.delete('/<room_id>')
@require_auth
def delete_room(room_id: str):
    from flask import g
    _svc.delete(room_id, g.company_id)
    return '', 204
