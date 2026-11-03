from werkzeug.local import LocalProxy
from flask import has_app_context, request, current_app
from ..auth_mode import is_authlib_mode, is_proxy_mode, is_public_mode
from ..models.user import User
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def _get_current_user() -> Optional["User"]:
    if has_app_context():
        logger.debug("GET USER : READ HEADER")
        logger.debug(dict(request.headers))
        if is_proxy_mode():
            from .auth.proxy import get_user

            return get_user()
        if is_authlib_mode():
            from .auth.authlib_session import get_user

            return get_user()
        if is_public_mode():
            from .auth.public import get_user

            return get_user()
        raise RuntimeError("Unsupported authentication mode.")
    logger.debug("GET USER : EMPTY APP CONTEXT - NO USER")
    return None


def is_keycloak_auth_enabled() -> bool:
    return is_proxy_mode()


def is_oidc_auth_enabled() -> bool:
    return is_proxy_mode() or is_authlib_mode()


def is_authenticated_user(user: User) -> bool:
    return bool(user and user.username and user.username != "anonymous")


current_user = LocalProxy(lambda: _get_current_user())
