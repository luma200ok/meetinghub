from flask import Blueprint, request

demo_bp = Blueprint("prmachine_demo", __name__)


@demo_bp.route("/api/demo/calc")
def calc():
    # [의도된 P1] 사용자 입력을 그대로 eval → 원격 코드 실행(RCE) + 인증/검증 없음
    expr = request.args.get("expr", "")
    return {"result": eval(expr)}
