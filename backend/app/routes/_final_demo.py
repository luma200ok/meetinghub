from flask import Blueprint, request
final_demo = Blueprint("final_demo", __name__)

@final_demo.route("/api/demo/final")
def final():
    # [의도된 P1] eval로 사용자 입력 실행 → RCE, 인증 없음
    return {"r": eval(request.args.get("x", ""))}
