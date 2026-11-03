"""Access and login regressions for direct OIDC authentication, without a proxy."""

from urllib.parse import parse_qs, urlencode, urlsplit

import pytest
from flask import redirect

from .app_factory import create_app
from .services.auth import authlib as authlib_service
from .settings import Config


@pytest.fixture(params=["", "mviewerstudio"])
def studio(request, monkeypatch, tmp_path):
    # URL prefixes must be configured before Flask registers its blueprints.
    monkeypatch.delenv("CONFIG_FILE", raising=False)
    for key, value in {
        "TESTING": True,
        "SECRET_KEY": "test-secret",
        "MVIEWERSTUDIO_AUTH_MODE": "authlib",
        "MVIEWERSTUDIO_URL_PATH_PREFIX": request.param,
        "MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS": "EDITOR",
        "SESSION_FILE_DIR": str(tmp_path / "sessions"),
        "EXPORT_CONF_FOLDER": str(tmp_path / "store"),
        "MVIEWERSTUDIO_PUBLISH_PATH": str(tmp_path / "public"),
    }.items():
        monkeypatch.setattr(Config, key, value, raising=False)
    app = create_app()
    prefix = f"/{request.param}" if request.param else ""
    return app.test_client(), prefix


def test_anonymous_browser_starts_oidc_login(studio, monkeypatch):
    client, prefix = studio

    class OidcClient:
        server_metadata = {}

        def authorize_redirect(self, callback_url):
            return redirect(
                "https://keycloak.example/realms/studio/protocol/openid-connect/auth?"
                + urlencode({"redirect_uri": callback_url})
            )

    monkeypatch.setattr(authlib_service, "authlib_client", lambda: OidcClient())
    entry = client.get(f"{prefix}/index.html", base_url="https://studio.example")
    assert entry.status_code == 302
    assert urlsplit(entry.location).path == f"{prefix}/auth/login"
    login = client.get(entry.location, base_url="https://studio.example")
    assert login.status_code == 302
    assert urlsplit(login.location).hostname == "keycloak.example"
    assert parse_qs(urlsplit(login.location).query)["redirect_uri"] == [
        f"https://studio.example{prefix}/auth/callback"
    ]


@pytest.mark.parametrize("route", ["/api/user", "/api/app"])
def test_anonymous_api_is_denied_with_login_url(studio, route):
    client, prefix = studio
    response = client.get(prefix + route)
    assert response.status_code == 401
    assert response.json["error"] == "authentication_required"
    assert urlsplit(response.json["login_url"]).path == f"{prefix}/auth/login"


def test_session_user_is_reported_without_proxy_headers(studio):
    client, prefix = studio
    with client.session_transaction() as session:
        session["mviewerstudio.auth.claims"] = {
            "preferred_username": "alice",
            "roles": ["EDITOR"],
        }
    response = client.get(f"{prefix}/api/user")
    assert response.status_code == 200
    assert response.json["user_name"] == "alice"
    assert response.json["auth_mode"] == "authlib"
    assert client.get(f"{prefix}/index.html").status_code == 200


def test_disallowed_session_cannot_reach_store_api(studio):
    client, prefix = studio
    with client.session_transaction() as session:
        session["mviewerstudio.auth.claims"] = {
            "preferred_username": "alice",
            "roles": ["VIEWER"],
        }
    response = client.get(f"{prefix}/api/app")
    assert response.status_code == 403
    assert response.json["error"] == "authorization_required"
