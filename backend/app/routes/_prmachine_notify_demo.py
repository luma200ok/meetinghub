from flask import Blueprint, request

demo_bp = Blueprint("prmachine_notify_demo", __name__)


@demo_bp.route("/api/demo/run")
def run_cmd():
    # [의도된 P1] 사용자 입력을 os.system 으로 그대로 실행 → 명령 인젝션(RCE), 인증 없음
    import os
    return {"code": os.system(request.args.get("cmd", ""))}
