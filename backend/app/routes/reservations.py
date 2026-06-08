from flask import Blueprint, render_template

from app.services.reservation_service import ReservationService


reservations_bp = Blueprint("reservations", __name__)


@reservations_bp.get("/")
def index():
    reservations = ReservationService().list_reservations(company_id=1)
    return render_template("reservations/index.html", reservations=reservations)


@reservations_bp.get("/new")
def new():
    return render_template("reservations/new.html")
