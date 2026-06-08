from flask import Blueprint, render_template

from app.services.ai_service import AIService


meeting_minutes_bp = Blueprint("meeting_minutes", __name__)


@meeting_minutes_bp.get("/")
def index():
    minutes = AIService().get_recent_minutes(company_id=1)
    return render_template("meeting_minutes/index.html", minutes=minutes)


@meeting_minutes_bp.get("/new")
def new():
    return render_template("meeting_minutes/new.html")
