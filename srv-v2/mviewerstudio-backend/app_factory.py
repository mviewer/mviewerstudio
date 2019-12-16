from flask import Flask
import logging
from sentry_sdk.integrations.flask import FlaskIntegration
import sentry_sdk
from .error_handlers import ERROR_HANDLERS
from .route import basic_store


def init_sentry():
    # sentry is a services that collect exception. it sends data _ONLY_ if you
    # specify the SENTRY_DSN envrionment variable. Sentry is an opensource
    # software (https://github.com/getsentry/sentry) that can be self hosted or
    # available as SaaS. No impact if you don't want to use it.
    sentry_sdk.init(integrations=[FlaskIntegration()])


def setup_logging(app: Flask) -> None:
    logging.basicConfig(level=app.config["LOG_LEVEL"])


def load_config(app: Flask) -> None:
    app.config.from_object("settings.Config")
    app.config.from_envvar("CONFIG_FILE", silent=True)


def load_error_handlers(app: Flask) -> None:
    for code, handler in ERROR_HANDLERS:
        app.register_error_handler(code, handler)


def load_blueprint(app: Flask) -> None:
    app.register_blueprint(basic_store)


def create_app() -> Flask:
    init_sentry()
    app = Flask("mviewerstudio")
    load_config(app)
    load_error_handlers(app)
    load_blueprint(app)
    setup_logging(app)
    return app
