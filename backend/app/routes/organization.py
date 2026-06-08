from flask import Blueprint, render_template

from app.services.organization_service import OrganizationService


organization_bp = Blueprint("organization", __name__)


@organization_bp.get("/")
def index():
    organization = OrganizationService().get_organization_chart(company_id=1)
    return render_template("organization/index.html", organization=organization)
