from werkzeug.local import LocalProxy
from flask import has_app_context, request, current_app
from ..models.user import User
from .commons import replace_special_chars
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def _get_current_user() -> Optional["User"]:
    if has_app_context():
        logger.debug("GET USER : READ HEADER")
        logger.debug(dict(request.headers))
        roles = request.headers.get("sec-roles", "").split(";")
        # sec-org by default. Use sec-orgname to have organism long name
        orgname = request.headers.get("sec-org")info
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
        return user
    logger.debug("GET USER : EMPTY APP CONTEXT - NO USER")
    return None


current_user = LocalProxy(lambda: _get_current_user())
