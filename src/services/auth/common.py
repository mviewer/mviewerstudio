"""Cross-mode access control helpers for protected routes."""

from pathlib import Path

from flask import current_app, jsonify, redirect, request, send_from_directory, url_for
from werkzeug.exceptions import Forbidden, Unauthorized

from ...auth_mode import is_authlib_mode, is_public_mode
from .authlib import allowed_authlib_groups, authlib_user_is_allowed
from ...utils.login_utils import current_user, is_authenticated_user


def _request_path_without_prefix() -> str:
    """Return the current request path without the optional app URL prefix."""
    path = request.path.lstrip("/")
    app_prefix = current_app.config.get("MVIEWERSTUDIO_URL_PATH_PREFIX", "").strip("/")
    if app_prefix and path.startswith(f"{app_prefix}/"):
        return path[len(app_prefix) + 1 :]
    return path


def _anonymous_redirect_url() -> str:
    """Return the browser fallback URL advertised to anonymous API callers."""
    configured_url = current_app.config.get("MVIEWERSTUDIO_AUTHLIB_ANONYMOUS_REDIRECT_URL", "")
    configured_url = configured_url.strip() if isinstance(configured_url, str) else ""
    if configured_url:
        return configured_url
    return request.host_url


def _is_studio_entry_request() -> bool:
    """Return ``True`` when the request targets the studio HTML entry point."""
    path = request.path.rstrip("/")
    app_prefix = current_app.config.get("MVIEWERSTUDIO_URL_PATH_PREFIX", "").strip("/")
    prefixed_root = f"/{app_prefix}" if app_prefix else ""
    return path.endswith("/index.html") or path in {"", prefixed_root}


def _is_api_request() -> bool:
    """Return ``True`` when the request targets a prefixed or root API route."""
    path = request.path
    app_prefix = current_app.config.get("MVIEWERSTUDIO_URL_PATH_PREFIX", "").strip("/")
    prefixed_api_root = f"/{app_prefix}/api/" if app_prefix else "/api/"
    return path.startswith("/api/") or path.startswith(prefixed_api_root)


def _is_error_asset_request() -> bool:
    """Return ``True`` for the small set of static assets used by error pages."""
    return _request_path_without_prefix() in {
        "css/errors.css",
        "img/homeMstudio.svg",
        "img/logo_mviewerstudio.svg",
    }


def _error_page_response(filename: str, status_code: int):
    """Serve a static HTML error page from ``src/static/errors``."""
    errors_dir = Path(__file__).resolve().parents[2] / "static" / "errors"
    return send_from_directory(errors_dir, filename), status_code


def _forbidden_authlib_response():
    """Return the most appropriate forbidden response for the current request."""
    allowed_groups = allowed_authlib_groups()
    if _is_api_request():
        return (
            jsonify(
                {
                    "error": "authorization_required",
                    "description": "You are authenticated but not allowed to access MviewerStudio.",
                    "allowed_groups": allowed_groups,
                    "user_groups": current_user.roles,
                }
            ),
            403,
        )
    if _is_studio_entry_request():
        # Browser access to the studio entry point should render a user-facing
        # HTML page instead of falling through to the generic JSON error handler.
        return _error_page_response("403.html", 403)
    raise Forbidden("You are authenticated but not allowed to access MviewerStudio.")


def require_authenticated_user() -> None:
    """Allow public mode, otherwise enforce an authenticated application user.

    In Authlib mode, browser navigation is redirected to the local login route.
    API requests still receive a ``401 Unauthorized`` response.

    Returns a Flask response when the caller must be redirected or denied
    immediately; otherwise returns ``None`` and lets the route continue.
    """
    if is_public_mode():
        return
    if not is_authenticated_user(current_user):
        if is_authlib_mode():
            login_url = url_for(
                "auth-routes.login",
                next=request.headers.get("X-Auth-Return-To") or request.referrer or request.url,
            )
            if _is_studio_entry_request():
                return redirect(login_url, code=302)
            if _is_api_request():
                return (
                    jsonify(
                        {
                            "error": "authentication_required",
                            "login_url": login_url,
                            "redirect_url": _anonymous_redirect_url(),
                        }
                    ),
                    401,
                )
            return redirect(login_url, code=302)
        raise Unauthorized("Authentication required.")
    if is_authlib_mode() and not authlib_user_is_allowed():
        # Let the browser fetch the minimal static assets needed to render the
        # dedicated 401/403 HTML pages without exposing the rest of /static.
        if _is_error_asset_request():
            return
        return _forbidden_authlib_response()


def require_authenticated_studio_entry() -> None:
    """Protect the studio entry page before any application HTML is served."""
    if _is_studio_entry_request():
        return require_authenticated_user()
