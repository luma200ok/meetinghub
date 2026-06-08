# 담당: 김관영 — 조직도 (부서, 직급, 직원)
from flask import Blueprint, request, jsonify
from app.services.organization_service import OrganizationService
from app.middleware.auth import require_auth

organization_bp = Blueprint('organization', __name__)
_svc = OrganizationService()


@organization_bp.get('/departments')
@require_auth
def list_departments():
    return jsonify(_svc.list_departments())


@organization_bp.post('/departments')
@require_auth
def create_department():
    return jsonify(_svc.create_department(request.get_json())), 201


@organization_bp.put('/departments/<dept_id>')
@require_auth
def update_department(dept_id: str):
    return jsonify(_svc.update_department(dept_id, request.get_json()))


@organization_bp.delete('/departments/<dept_id>')
@require_auth
def delete_department(dept_id: str):
    _svc.delete_department(dept_id)
    return '', 204


@organization_bp.get('/positions')
@require_auth
def list_positions():
    return jsonify(_svc.list_positions())


@organization_bp.post('/positions')
@require_auth
def create_position():
    return jsonify(_svc.create_position(request.get_json())), 201


@organization_bp.get('/members')
@require_auth
def list_members():
    return jsonify(_svc.list_members())
