"""Proxy routes for the Grist API."""
from urllib.parse import quote

import requests
from flask import Blueprint, Response, current_app, jsonify, request
from werkzeug.exceptions import BadRequest


grist_proxy_blueprint = Blueprint("grist-proxy", __name__)


@grist_proxy_blueprint.route(
    "/grist/api/<path:api_path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"]
)
def grist_proxy(api_path: str) -> Response:
    """
    Proxy API requests to the configured Grist instance.

    :param str api_path: Grist endpoint path relative to ``/api/``.
    :return: Grist response or a JSON error with its HTTP status.
    """
    if any(part in (".", "..") for part in api_path.split("/")):
        raise BadRequest("Invalid Grist API path")

    # Only forward API headers, never the application's session cookies.
    headers = {
        name: request.headers[name]
        for name in ("Authorization", "Content-Type", "Accept")
        if name in request.headers
    }
    if api_path == "profile/apikey" and "Authorization" not in headers:
        return jsonify(error="Saisissez votre clé API Grist manuellement."), 401

    url = current_app.config["GRIST_API_URL"].rstrip("/")
    url += "/api/" + quote(api_path, safe="/")
    try:
        upstream = requests.request(
            request.method,
            url,
            params=request.query_string,
            data=request.get_data(),
            headers=headers,
            timeout=current_app.config["GRIST_PROXY_TIMEOUT"],
            allow_redirects=False,
        )
        with upstream:
            if 300 <= upstream.status_code < 400:
                return jsonify(error="Unexpected Grist API redirect."), 502
            return Response(
                upstream.content,
                status=upstream.status_code,
                content_type=upstream.headers.get("Content-Type", "application/json"),
                headers={"Cache-Control": "no-store"},
            )
    except requests.Timeout:
        return jsonify(error="Grist API request timed out."), 504
    except requests.RequestException:
        return jsonify(error="Unable to reach the Grist API."), 502
