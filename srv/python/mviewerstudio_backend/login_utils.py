from werkzeug.local import LocalProxy
from flask import has_app_context, request
from dataclasses import dataclass
from typing import List, Optional
import logging


logger = logging.getLogger(__name__)


@dataclass
class User:
    username: str
    firstname: str
    lastname: str
    organisation: Optional[str]
    roles: List[str]

    def as_dict(self):
        return {
            "user_name": self.username,
            "first_name": self.firstname,
            "last_name": self.lastname,
            "organisation": {"legal_name": self.organisation},
            "roles": self.roles,
        }


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
        logging.info(f'logged user: {user}')
        return user
    logging.debug(f'No app context. Returning no user')
    return None


current_user = LocalProxy(lambda: _get_current_user())
