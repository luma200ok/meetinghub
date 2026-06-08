# 담당: 송유미 — 알림 (5분 전 알림, 알림 목록)
from flask import Blueprint, request, jsonify
from app.services.notification_service import NotificationService
from app.middleware.auth import require_auth

notifications_bp = Blueprint('notifications', __name__)
_svc = NotificationService()


@notifications_bp.get('/')
@require_auth
def list_notifications():
    return jsonify(_svc.list())


@notifications_bp.patch('/<notification_id>/read')
@require_auth
def mark_read(notification_id: str):
    return jsonify(_svc.mark_read(notification_id))


@notifications_bp.patch('/read-all')
@require_auth
def mark_all_read():
    return jsonify(_svc.mark_all_read())
