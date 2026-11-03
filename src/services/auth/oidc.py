"""Helpers for reverse-proxy OIDC mode.

This layer assumes authentication has already been done upstream by a gateway
or by ``oauth2-proxy`` and only handles logout URL composition and cookie
cleanup on the Flask side.
"""

from flask import Response, current_app, request
from urllib.parse import urlencode, urlparse


OIDC_LOGOUT_COOKIES = (
    "_oauth2_proxy",
    "_oauth2_proxy_csrf",
)

KEYCLOAK_LOGOUT_COOKIES = (
    "AUTH_SESSION_ID",
    "AUTH_SESSION_ID_LEGACY",
    "KC_AUTH_SESSION_HASH",
    "KC_RESTART",
    "KEYCLOAK_IDENTITY",
    "KEYCLOAK_IDENTITY_LEGACY",
    "KEYCLOAK_SESSION",
    "KEYCLOAK_SESSION_LEGACY",
)


def is_oidc_auth_enabled() -> bool:
    """Return whether the legacy reverse-proxy OIDC mode is enabled."""
    return current_app.config["MVIEWERSTUDIO_AUTH_TYPE"] in {"keycloak", "oidc"}


def app_root_path() -> str:
    """Return the studio root path, including the optional URL prefix."""
    app_prefix = current_app.config.get("MVIEWERSTUDIO_URL_PATH_PREFIX", "").strip("/")
    if not app_prefix:
        return "/"
    return f"/{app_prefix}/"


def expire_cookie(response: Response, key: str, path_value: str) -> None:
    """Expire a cookie on the given path."""
    response.set_cookie(key, "", max_age=0, expires=0, path=path_value)


def provider_cookie_paths() -> list[str]:
    """Return likely IdP cookie paths derived from the configured issuer URL."""
    issuer_url = current_app.config.get("OAUTH2_PROXY_OIDC_ISSUER_URL", "").strip()
    issuer_path = urlparse(issuer_url).path.rstrip("/")
    if not issuer_path:
        return ["/keycloak/"]
    realm_parent = issuer_path.rsplit("/", 1)[0]
    paths = [f"{issuer_path}/"]
    if realm_parent:
        paths.append(f"{realm_parent}/")
    return paths


def build_logout_redirect() -> str:
    """Build the upstream logout redirect used in proxy-based OIDC mode."""
    end_session_endpoint = current_app.config.get("OIDC_END_SESSION_ENDPOINT", "").strip()
    issuer_url = current_app.config.get("OAUTH2_PROXY_OIDC_ISSUER_URL", "").strip()
    client_id = current_app.config.get("OAUTH2_PROXY_CLIENT_ID", "").strip()
    if not end_session_endpoint and issuer_url:
        issuer_parts = urlparse(issuer_url)
        issuer_base_path = issuer_parts.path.rstrip("/")
        logout_path = f"{issuer_base_path}/protocol/openid-connect/logout"
        end_session_endpoint = (
            f"{issuer_parts.scheme}://{issuer_parts.netloc}{logout_path}"
        )

    if not end_session_endpoint:
        return "/oauth2/sign_out"

    redirect_target = f"/oauth2/start?{urlencode({'rd': app_root_path()})}"
    post_logout_redirect_uri = current_app.config.get(
        "OIDC_POST_LOGOUT_REDIRECT_URI", ""
    ).strip() or f"{request.host_url.rstrip('/')}{redirect_target}"

    logout_params = {"post_logout_redirect_uri": post_logout_redirect_uri}
    if client_id:
        logout_params["client_id"] = client_id
    oidc_logout_url = f"{end_session_endpoint}?{urlencode(logout_params)}"
    return f"/oauth2/sign_out?{urlencode({'rd': oidc_logout_url})}"


def apply_logout_cookies(response: Response) -> None:
    """Expire proxy and common Keycloak cookies on the response."""
    for cookie_name in OIDC_LOGOUT_COOKIES:
        expire_cookie(response, cookie_name, "/")
    for cookie_name in KEYCLOAK_LOGOUT_COOKIES:
        for cookie_path in provider_cookie_paths():
            expire_cookie(response, cookie_name, cookie_path)
