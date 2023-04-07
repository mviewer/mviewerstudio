from flask import Flask
import logging
from .error_handlers import ERROR_HANDLERS
from .route import basic_store


def setup_logging(app: Flask) -> None:
    logging.basicConfig(level=app.config["LOG_LEVEL"])


def load_config(app: Flask) -> None:
    app.config.from_object("mviewerstudio_backend.settings.Config")
    app.config.from_envvar("CONFIG_FILE", silent=True)


def load_error_handlers(app: Flask) -> None:
    for code, handler in ERROR_HANDLERS:
        app.register_error_handler(code, handler)


def load_blueprint(app: Flask) -> None:
    app.register_blueprint(basic_store)


def create_app() -> Flask:
    app = Flask("mviewerstudio")
    load_config(app)
    load_error_handlers(app)
    load_blueprint(app)
    setup_logging(app)
    return app
