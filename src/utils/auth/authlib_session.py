"""User adapter for the Authlib-managed session mode."""

from ...models.user import User
from ...services.auth.authlib import get_authlib_session_claims
from .common import build_user


def get_user() -> User:
    """Build the current user from normalized claims stored in session."""
    claims = get_authlib_session_claims()
    return build_user(
        claims.get("preferred_username"),
        claims.get("given_name"),
        claims.get("family_name"),
        claims.get("organization"),
        claims.get("roles", [""]),
    )
