from flask import Flask

from app.routes.auth import auth_bp
from app.routes.companies import companies_bp
from app.routes.organization import organization_bp
from app.routes.meeting_rooms import meeting_rooms_bp
from app.routes.reservations import reservations_bp
from app.routes.minutes import minutes_bp
from app.routes.ai import ai_bp
from app.routes.tasks import tasks_bp
from app.routes.notifications import notifications_bp
from app.routes.dashboard import dashboard_bp
from app.routes.search import search_bp


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(auth_bp,         url_prefix='/api/auth')
    app.register_blueprint(companies_bp,    url_prefix='/api/companies')
    app.register_blueprint(organization_bp, url_prefix='/api')
    app.register_blueprint(meeting_rooms_bp, url_prefix='/api/meeting-rooms')
    app.register_blueprint(reservations_bp, url_prefix='/api/reservations')
    app.register_blueprint(minutes_bp,      url_prefix='/api/minutes')
    app.register_blueprint(ai_bp,           url_prefix='/api/ai')
    app.register_blueprint(tasks_bp,        url_prefix='/api/tasks')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(dashboard_bp,    url_prefix='/api/dashboard')
    app.register_blueprint(search_bp,       url_prefix='/api/search')
