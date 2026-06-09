"""
action_items.py
Action Items CRUD 라우트.
GET  /api/action-items?minute_id=<id>  — 특정 회의록의 목록
POST /api/action-items                  — 수동 생성
PUT  /api/action-items/<id>             — 수정 (status 토글 포함)
DELETE /api/action-items/<id>           — 삭제
"""
from flask import Blueprint, request, jsonify
from app.services.action_item_service import ActionItemService
from app.middleware.auth import require_auth

action_items_bp = Blueprint("action_items", __name__)
_svc = ActionItemService()


@action_items_bp.route("", methods=["GET"])
@require_auth
def list_action_items():
    """minute_id 쿼리 파라미터가 있으면 특정 회의록 기준, 없으면 회사 전체."""
    minute_id = request.args.get("minute_id")
    if minute_id:
        return jsonify(_svc.list_by_minute(minute_id))
    return jsonify(_svc.list_by_company())


@action_items_bp.route("", methods=["POST"])
@require_auth
def create_action_item():
    """Action Item 수동 생성."""
    return jsonify(_svc.create(request.get_json(silent=True) or {})), 201


@action_items_bp.route("/<item_id>", methods=["PUT"])
@require_auth
def update_action_item(item_id: str):
    """상태·내용·담당자·기한 업데이트."""
    return jsonify(_svc.update(item_id, request.get_json(silent=True) or {}))


@action_items_bp.route("/<item_id>", methods=["DELETE"])
@require_auth
def delete_action_item(item_id: str):
    """Action Item 삭제."""
    _svc.delete(item_id)
    return "", 204
