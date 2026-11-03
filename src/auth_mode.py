from flask import current_app, request


AUTH_MODE_PROXY = "proxy"
AUTH_MODE_AUTHLIB = "authlib"
AUTH_MODE_PUBLIC = "public"
AUTH_MODE_AUTO = "auto"

_PROXY_MODE_ALIASES = {
    "gateway",
    "oauth2-proxy",
    "oauth2_proxy",
    AUTH_MODE_PROXY,
}
_PUBLIC_MODE_ALIASES = {"anonymous", AUTH_MODE_PUBLIC}
_LEGACY_PROXY_AUTH_TYPES = {"georchestra", "keycloak", "oidc"} | _PROXY_MODE_ALIASES

_OIDC_IDENTITY_HEADERS = (
    "X-Forwarded-User",
    "X-Auth-Request-User",
    "X-Forwarded-Preferred-Username",
    "X-Auth-Request-Preferred-Username",
    "Remote-User",
)


def _normalize_mode(value: str | None) -> str:
    if not value:
        return ""
    return value.strip().lower()


def has_proxy_identity_headers() -> bool:
    return bool(request.headers.get("sec-username")) or has_oidc_identity_headers()


def has_oidc_identity_headers() -> bool:
    return any(request.headers.get(header_name) for header_name in _OIDC_IDENTITY_HEADERS)


def is_authlib_configured() -> bool:
    metadata_url = current_app.config.get("MVIEWERSTUDIO_AUTHLIB_METADATA_URL", "").strip()
    issuer = current_app.config.get("MVIEWERSTUDIO_AUTHLIB_ISSUER", "").strip()
    client_id = current_app.config.get("MVIEWERSTUDIO_AUTHLIB_CLIENT_ID", "").strip()
    client_secret = current_app.config.get(
        "MVIEWERSTUDIO_AUTHLIB_CLIENT_SECRET", ""
    ).strip()
    return bool((metadata_url or issuer) and client_id and client_secret)


def get_configured_auth_mode() -> str:
    configured_mode = _normalize_mode(current_app.config.get("MVIEWERSTUDIO_AUTH_MODE"))
    if configured_mode in _PROXY_MODE_ALIASES:
        return AUTH_MODE_PROXY
    if configured_mode == AUTH_MODE_AUTHLIB:
        return AUTH_MODE_AUTHLIB
    if configured_mode in _PUBLIC_MODE_ALIASES:
        return AUTH_MODE_PUBLIC

    legacy_auth_type = _normalize_mode(current_app.config.get("MVIEWERSTUDIO_AUTH_TYPE"))
    if legacy_auth_type in _LEGACY_PROXY_AUTH_TYPES:
        return AUTH_MODE_PROXY
    if legacy_auth_type == AUTH_MODE_AUTHLIB:
        return AUTH_MODE_AUTHLIB
    if legacy_auth_type in _PUBLIC_MODE_ALIASES:
        return AUTH_MODE_PUBLIC
    if configured_mode == AUTH_MODE_AUTO:
        return AUTH_MODE_AUTO
    return AUTH_MODE_AUTO


def resolve_auth_mode() -> str:
    configured_mode = get_configured_auth_mode()
    if configured_mode == AUTH_MODE_PROXY:
        return AUTH_MODE_PROXY
    if configured_mode == AUTH_MODE_AUTHLIB:
        return AUTH_MODE_AUTHLIB
    if configured_mode == AUTH_MODE_PUBLIC:
        return AUTH_MODE_PUBLIC
    if has_proxy_identity_headers():
        return AUTH_MODE_PROXY
    if is_authlib_configured():
        return AUTH_MODE_AUTHLIB
    return AUTH_MODE_PUBLIC


def is_proxy_mode() -> bool:
    return resolve_auth_mode() == AUTH_MODE_PROXY


def is_authlib_mode() -> bool:
    return resolve_auth_mode() == AUTH_MODE_AUTHLIB


def is_public_mode() -> bool:
    return resolve_auth_mode() == AUTH_MODE_PUBLIC
