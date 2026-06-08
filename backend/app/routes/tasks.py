# 담당: 정재봉 — 업무 관리 (Action Item 수정/상태변경)
from flask import Blueprint, request, jsonify
from app.services.task_service import TaskService
from app.middleware.auth import require_auth
from app.middleware.tenant import require_company

tasks_bp = Blueprint('tasks', __name__)
_svc = TaskService()


@tasks_bp.get('')
@require_auth
@require_company
def list_tasks():
    # 선택 필터: ?status=TODO&assignee_id=<uuid>&limit=20&offset=0
    status = request.args.get('status')
    assignee_id = request.args.get('assignee_id')
    limit = request.args.get('limit', type=int)
    offset = request.args.get('offset', type=int)
    return jsonify(
        _svc.list(status=status, assignee_id=assignee_id, limit=limit, offset=offset)
    )


@tasks_bp.put('/<task_id>')
@require_auth
@require_company
def update_task(task_id: str):
    return jsonify(_svc.update(task_id, request.get_json()))


@tasks_bp.patch('/<task_id>/status')
@require_auth
@require_company
def update_status(task_id: str):
    data = request.get_json()
    return jsonify(_svc.update_status(task_id, data['status']))


@tasks_bp.patch('/<task_id>/assignee')
@require_auth
@require_company
def update_assignee(task_id: str):
    data = request.get_json()
    return jsonify(_svc.update_assignee(task_id, data['assignee_id']))
