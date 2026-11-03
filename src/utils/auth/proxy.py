"""Dispatcher for reverse-proxy authentication adapters.

When OIDC-oriented forwarded headers are present, the OIDC adapter is used.
These take precedence over sec-* headers when both formats are present.
Otherwise the geOrchestra header format is assumed.
"""

from ...models.user import User
from ...auth_mode import has_oidc_identity_headers
from .georchestra import get_user as get_georchestra_user
from .oidc import get_user as get_oidc_user


def get_user() -> User:
    """Return the user built from the header format detected on the request."""
    if has_oidc_identity_headers():
        return get_oidc_user()
    return get_georchestra_user()
