from flask import Flask

from app.routes.auth import auth_bp
from app.routes.company import company_bp
from app.routes.dashboard import dashboard_bp
from app.routes.meeting_minutes import meeting_minutes_bp
from app.routes.meeting_rooms import meeting_rooms_bp
from app.routes.organization import organization_bp
from app.routes.reservations import reservations_bp
from app.routes.tasks import tasks_bp


def create_app():
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static",
    )
    app.config.from_object("app.config.Config")

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(company_bp, url_prefix="/company")
    app.register_blueprint(organization_bp, url_prefix="/organization")
    app.register_blueprint(meeting_rooms_bp, url_prefix="/meeting-rooms")
    app.register_blueprint(reservations_bp, url_prefix="/reservations")
    app.register_blueprint(meeting_minutes_bp, url_prefix="/meeting-minutes")
    app.register_blueprint(tasks_bp, url_prefix="/tasks")

    return app
