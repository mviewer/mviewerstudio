from werkzeug.local import LocalProxy
from flask import has_app_context, request, current_app
from ..models.user import User
from .commons import replace_special_chars
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def _get_current_user() -> Optional["User"]:
    if has_app_context():
        logger.info("REQUEST HEADER")
        logger.info(dict(request.headers))
        roles = request.headers.get("sec-roles", "").split(";")
        # use sec-orgname by default
        orgname = request.headers.get("sec-orgname")
        if not orgname:
            orgname = current_app.config["DEFAULT_ORG"]
        normalize_orgname = replace_special_chars(orgname)
        user = User(
            request.headers.get("sec-username", "anonymous"),
            request.headers.get("sec-firstname", "anonymous"),
            request.headers.get("sec-lastname", "anonymous"),
            orgname,
            normalize_orgname,
            roles,
        )
        logging.info(f"logged user: {user}")
        return user
    logging.debug(f"No app context. Returning no user")
    return None


current_user = LocalProxy(lambda: _get_current_user())
