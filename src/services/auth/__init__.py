"""Authentication service entry points used by Flask routes and bootstrap code."""

from .common import require_authenticated_user
from .authlib import clear_authlib_session, complete_authlib_login, init_authlib_client
from .authlib import build_authlib_logout_redirect, start_authlib_login
from .mode import is_authlib_mode
from .oidc import apply_logout_cookies, build_logout_redirect, is_oidc_auth_enabled

__all__ = [
    "apply_logout_cookies",
    "build_authlib_logout_redirect",
    "build_logout_redirect",
    "clear_authlib_session",
    "complete_authlib_login",
    "init_authlib_client",
    "is_authlib_mode",
    "is_oidc_auth_enabled",
    "require_authenticated_user",
    "start_authlib_login",
]
