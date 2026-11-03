"""User adapter for public mode with no upstream authentication."""

from ...models.user import User
from .common import build_user


def get_user() -> User:
    """Return the anonymous/public user used when authentication is disabled."""
    return build_user(None, None, None, None, [""])
