from flask import Blueprint, render_template

from app.repositories.meeting_room_repository import MeetingRoomRepository


meeting_rooms_bp = Blueprint("meeting_rooms", __name__)


@meeting_rooms_bp.get("/")
def index():
    rooms = MeetingRoomRepository().list_by_company(company_id=1)
    return render_template("meeting_rooms/index.html", rooms=rooms)
