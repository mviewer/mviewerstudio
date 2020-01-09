from functools import wraps
from werkzeug.local import LocalProxy
from flask import abort, has_app_context, request
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class User:
    username: str
    firstname: str
    lastname: str
    org: Optional[str]
    role: List[str]

    def as_dict(self):
        return {
            "username": self.username,
            "firstname": self.firstname,
            "lastname": self.lastname,
            "org": self.org,
            "role": self.role,
        }


def login_required(func):
    @wraps(func)
    def _login_required(*args, **kwargs):
        if current_user.username == "anonymous":
            abort(403)
        return func(*args, **kwargs)

    return _login_required


def _get_current_user() -> "User":
    if has_app_context():
        roles = request.headers.get("sec-roles", "").split(";")
        return User(
            request.headers.get("sec-username", "anonymous"),
            request.headers.get("sec-firstname", "anonymous"),
            request.headers.get("sec-lastname", "anonymous"),
            request.headers.get("sec-org"),
            roles,
        )
    else:
        abort(503, "Cannot determine user")


current_user = LocalProxy(lambda: _get_current_user())
