from flask import Flask
from os import path, mkdir, makedirs
import logging
from werkzeug.middleware.proxy_fix import ProxyFix
from .extensions import oauth, session_manager
from .error_handlers import ERROR_HANDLERS
from .routes import basic_store
from .routes import auth_routes
from .services.auth import init_authlib_client
from .services.auth.common import require_authenticated_studio_entry
from .settings import Config

logger = logging.getLogger(__name__)


def setup_logging(app: Flask) -> None:
    log_level = app.config["LOG_LEVEL"]
    logging.basicConfig(
        level=log_level,
        format="[%(asctime)s] %(levelname)s (%(module)s): %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        force=True,
    )

    # Under Gunicorn, reuse the worker error handlers so Flask app logs end up in
    # the container stdout/stderr stream that `docker logs` reads.
    gunicorn_logger = logging.getLogger("gunicorn.error")
    if gunicorn_logger.handlers:
        app.logger.handlers = gunicorn_logger.handlers
        app.logger.propagate = False

    app.logger.setLevel(log_level)
    logging.getLogger().setLevel(log_level)


def load_config(app: Flask) -> None:
    app.config.from_object(Config)
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
    app.register_blueprint(auth_routes, url_prefix=app_prefix)


def init_extensions(app: Flask) -> None:
    session_dir = app.config.get("SESSION_FILE_DIR")
    if session_dir:
        makedirs(session_dir, exist_ok=True)
    session_manager.init_app(app)
    oauth.init_app(app)
    with app.app_context():
        init_authlib_client(app)


def init_publish_directory(app: Flask) -> None:
    if "MVIEWERSTUDIO_PUBLISH_PATH" not in app.config:
        return
    publish_path = app.config["MVIEWERSTUDIO_PUBLISH_PATH"]
    if not path.exists(publish_path) and publish_path:
        mkdir(publish_path)
        logger.info(f"CREATE PUBLISH PATH {publish_path}")
    app.publish_path = publish_path
    logger.info(f"PUBLISH PATH READY TO USE : {publish_path}")


def load_request_guards(app: Flask) -> None:
    @app.before_request
    def protect_studio_entry():
        return require_authenticated_studio_entry()


def create_app() -> Flask:
    app = Flask("mviewerstudio")
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
    load_config(app)
    setup_logging(app)
    init_extensions(app)
    load_error_handlers(app)
    load_request_guards(app)
    load_blueprint(app)
    init_publish_directory(app)
    logger.info(f"CREATE FLASK APP : SUCESS")
    return app
