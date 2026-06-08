from flask import Blueprint, render_template

from app.services.dashboard_service import DashboardService


dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/")
def index():
    dashboard = DashboardService().get_overview(company_id=1, user_id=1)
    return render_template("company/dashboard.html", dashboard=dashboard)
