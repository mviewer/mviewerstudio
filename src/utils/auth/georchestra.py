"""User adapter for geOrchestra-style reverse proxy headers."""

from flask import request

from ...models.user import User
from .common import build_user, split_roles


def get_user() -> User:
    """Build the authenticated user from GeOrchestra proxy headers."""
    return build_user(
        request.headers.get("sec-username"),
        request.headers.get("sec-firstname"),
        request.headers.get("sec-lastname"),
        request.headers.get("sec-org"),
        split_roles(request.headers.get("sec-roles")),
    )
