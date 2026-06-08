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

    @app.errorhandler(ValueError)
    def handle_bad_request(error):
        return jsonify({'error': str(error)}), 400

    @app.errorhandler(KeyError)
    def handle_missing_field(error):
        return jsonify({'error': f'{error.args[0]} 필드가 필요합니다.'}), 400

    @app.errorhandler(PermissionError)
    def handle_forbidden(error):
        return jsonify({'error': str(error)}), 403

    @app.errorhandler(LookupError)
    def handle_not_found(error):
        return jsonify({'error': str(error)}), 404

    return app
