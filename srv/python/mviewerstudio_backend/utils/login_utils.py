from werkzeug.local import LocalProxy
from flask import has_app_context, request
from ..models.user import User
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def _get_current_user() -> Optional["User"]:
    if has_app_context():
        roles = request.headers.get("sec-roles", "").split(";")
        user = User(
            request.headers.get("sec-username", "anonymous"),
            request.headers.get("sec-firstname", "anonymous"),
            request.headers.get("sec-lastname", "anonymous"),
            request.headers.get("sec-org"),
            roles,
        )
        logging.info(f"logged user: {user}")
        return user
    logging.debug(f"No app context. Returning no user")
    return None


current_user = LocalProxy(lambda: _get_current_user())
