from flask import Flask
from os import path, mkdir
import logging
from .error_handlers import ERROR_HANDLERS
from .route import basic_store

logger = logging.getLogger(__name__)

def setup_logging(app: Flask) -> None:
    logging.basicConfig(
        level=app.config["LOG_LEVEL"],
        format='[%(asctime)s] %(levelname)s (%(module)s): %(message)s', datefmt='%Y-%m-%d %H:%M:%S'
    )
    

def load_config(app: Flask) -> None:
    app.config.from_object("mviewerstudio_backend.settings.Config")
    app.config.from_envvar("CONFIG_FILE", silent=True)


def load_error_handlers(app: Flask) -> None:
    for code, handler in ERROR_HANDLERS:
        app.register_error_handler(code, handler)


def load_blueprint(app: Flask) -> None:
    app_prefix = app.config.get("MVIEWERSTUDIO_URL_PATH_PREFIX", "")
    if app_prefix:
        # Handle possible missing or excess / chars: needs to start with one but not end with one
        app_prefix = "/" + app_prefix.strip("/")
    app.register_blueprint(basic_store, url_prefix=app_prefix)


def init_publish_directory(app: Flask) -> None:
    if "MVIEWERSTUDIO_PUBLISH_PATH" not in app.config:
        return
    publish_path = app.config["MVIEWERSTUDIO_PUBLISH_PATH"]
    if not path.exists(publish_path) and publish_path:
        mkdir(publish_path)
        logger.info(f"CREATE PUBLISH PATH {publish_path}")
    app.publish_path = publish_path
    logger.info(f"PUBLISH PATH READY TO USE : {publish_path}")
    


def create_app() -> Flask:
    app = Flask("mviewerstudio")
    load_config(app)
    load_error_handlers(app)
    load_blueprint(app)
    setup_logging(app)
    init_publish_directory(app)
    logger.info(f"CREATE FLASK APP : SUCESS")
    return app
