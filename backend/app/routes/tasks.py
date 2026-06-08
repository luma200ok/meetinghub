# 담당: 정재봉 — 업무 관리 (Action Item 수정/상태변경)
from flask import Blueprint, request, jsonify
from app.services.task_service import TaskService
from app.middleware.auth import require_auth

tasks_bp = Blueprint('tasks', __name__)
_svc = TaskService()


@tasks_bp.get('/')
@require_auth
def list_tasks():
    return jsonify(_svc.list())


@tasks_bp.put('/<task_id>')
@require_auth
def update_task(task_id: str):
    return jsonify(_svc.update(task_id, request.get_json()))


@tasks_bp.patch('/<task_id>/status')
@require_auth
def update_status(task_id: str):
    data = request.get_json()
    return jsonify(_svc.update_status(task_id, data['status']))


@tasks_bp.patch('/<task_id>/assignee')
@require_auth
def update_assignee(task_id: str):
    data = request.get_json()
    return jsonify(_svc.update_assignee(task_id, data['assignee_id']))
