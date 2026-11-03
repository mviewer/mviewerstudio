"""Configurable claim paths used with provider-specific OIDC payloads."""

import json

import pytest
from flask import Flask, session

from .services.auth.authlib import AUTHLIB_SESSION_CLAIMS_KEY, normalize_claims
from .utils.auth.authlib_session import get_user


@pytest.fixture
def app():
    app = Flask(__name__)
    app.secret_key = "test"
    app.config["DEFAULT_ORG"] = "public"
    return app


@pytest.mark.parametrize("organization,path", [
    (["jdev", {"jdev": {}}], "organization[0]"),
    ("jdev", "organization"),
])
def test_organization_mapping_builds_user(app, organization, path):
    app.config["MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING"] = json.dumps({"organization": path})
    with app.test_request_context():
        session[AUTHLIB_SESSION_CLAIMS_KEY] = normalize_claims({
            "preferred_username": "john.doe", "organization": organization,
        })
        assert get_user().organisation == "jdev"


def test_nested_mapping_preserves_unmapped_claims(app):
    app.config["MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING"] = json.dumps({
        "organization": 'profile["org-name"]', "roles": "realm_access.roles",
    })
    with app.app_context():
        claims = normalize_claims({
            "email": "john@example.local", "profile": {"org-name": "jdev"},
            "realm_access": {"roles": ["MVIEWER_ACCESS"]},
        })
    assert claims["organization"] == "jdev"
    assert claims["roles"] == ["MVIEWER_ACCESS"]
    assert claims["email"] == "john@example.local"


@pytest.mark.parametrize("organization", [[], None, {}, "jdev"])
def test_missing_or_incompatible_path_uses_default_organization(app, organization):
    app.config["MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING"] = '{"organization":"organization[0]"}'
    with app.test_request_context():
        session[AUTHLIB_SESSION_CLAIMS_KEY] = normalize_claims({"organization": organization})
        assert get_user().organisation == "public"


@pytest.mark.parametrize("mapping", [
    "invalid", "[]", '{"unknown":"sub"}', '{"organization":0}',
    '{"organization":"organization[-1]"}',
    '{"organization":"organization["}',
    json.dumps({"organization": '__import__("os").getcwd()'}),
])
def test_invalid_mapping_is_rejected(app, mapping):
    app.config["MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING"] = mapping
    with app.app_context(), pytest.raises(ValueError):
        normalize_claims({})


def test_no_mapping_preserves_default_claims(app):
    with app.app_context():
        claims = normalize_claims({"organization": "jdev", "groups": ["USERS"]})
    assert claims["organization"] == "jdev"
    assert claims["roles"] == ["USERS"]
