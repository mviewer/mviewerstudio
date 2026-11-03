"""Thin re-export layer around the shared authentication mode resolver.

This module keeps imports stable for the rest of the application while the
actual resolution logic lives in ``src/auth_mode.py``.
"""

from ...auth_mode import AUTH_MODE_AUTHLIB, AUTH_MODE_AUTO, AUTH_MODE_PROXY
from ...auth_mode import AUTH_MODE_PUBLIC, get_configured_auth_mode
from ...auth_mode import has_proxy_identity_headers, is_authlib_configured
from ...auth_mode import is_authlib_mode, is_public_mode, is_proxy_mode
from ...auth_mode import resolve_auth_mode
