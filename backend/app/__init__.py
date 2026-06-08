from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.routes import register_blueprints


def create_app(config_class: type = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, origins=app.config['CORS_ORIGINS'])

    register_blueprints(app)

    return app
