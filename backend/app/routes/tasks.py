from flask import Blueprint, render_template

from app.services.task_service import TaskService


tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.get("/")
def index():
    tasks = TaskService().list_my_tasks(company_id=1, user_id=1)
    return render_template("tasks/index.html", tasks=tasks)
