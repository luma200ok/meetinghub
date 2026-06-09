from flask import Flask, jsonify


def create_app(config_class: type | None = None) -> Flask:
    from flask_cors import CORS

    from app.config import Config
    from app.errors import register_error_handlers
    from app.routes import register_blueprints

    app = Flask(__name__)
    app.config.from_object(config_class or Config)

    CORS(app, origins=app.config['CORS_ORIGINS'])

    # 헬스체크 (Render 등 배포 플랫폼 상태 확인용 — 인증 불필요)
    @app.get('/health')
    def health():
        return jsonify({'status': 'ok'})

    register_blueprints(app)
    register_error_handlers(app)

    return app
