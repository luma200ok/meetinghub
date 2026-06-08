from flask import Blueprint, render_template

from app.services.organization_service import OrganizationService


company_bp = Blueprint("company", __name__)


@company_bp.get("/")
def detail():
    company = OrganizationService().get_company(company_id=1)
    return render_template("company/detail.html", company=company)


@company_bp.get("/invite")
def invite():
    return render_template("company/invite.html")
