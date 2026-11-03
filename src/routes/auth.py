from flask import Blueprint, Response, jsonify, redirect, url_for

from ..services.auth import apply_logout_cookies, build_authlib_logout_redirect
from ..services.auth import build_logout_redirect, clear_authlib_session
from ..services.auth import complete_authlib_login, is_authlib_mode
from ..services.auth import require_authenticated_user, start_authlib_login
from ..auth_mode import resolve_auth_mode
from ..utils.login_utils import current_user

auth_routes = Blueprint("auth-routes", __name__)


@auth_routes.route("/api/user", methods=["GET"])
def user() -> Response:
    """
    Return the authenticated user and the active authentication mode.
    """
    response = require_authenticated_user()
    if response is not None:
        return response
    user_payload = current_user.as_dict()
    user_payload["auth_mode"] = resolve_auth_mode()
    return jsonify(user_payload)


@auth_routes.route("/auth/login", methods=["GET"])
def login() -> Response:
    if not is_authlib_mode():
        return redirect(url_for("basic-store.default_doc"), code=302)
    return start_authlib_login()


@auth_routes.route("/auth/callback", methods=["GET"])
def authlib_callback() -> Response:
    if not is_authlib_mode():
        return redirect(url_for("basic-store.default_doc"), code=302)
    return complete_authlib_login()


@auth_routes.route("/logout", methods=["GET"])
@auth_routes.route("/api/logout", methods=["GET"])
def logout() -> Response:
    response = require_authenticated_user()
    if response is not None:
        return response
    if is_authlib_mode():
        redirect_target = build_authlib_logout_redirect()
        clear_authlib_session()
        return redirect(redirect_target, code=302)

    response = redirect(build_logout_redirect(), code=302)
    apply_logout_cookies(response)
    return response
