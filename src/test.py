# create a fixture with 3 files, 2 belong to user1 and the other belong to user2.
from .utils.login_utils import _get_current_user, User
import pytest
from .app_factory import create_app
from .services.auth import authlib as authlib_service
from .services.auth.authlib import allowed_authlib_groups, normalize_claims
import hashlib
import os
from pathlib import Path
import shutil

test_xml = """<?xml version="1.0" encoding="UTF-8"?>
<config mviewerstudioversion="3.1">
<metadata>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
<rdf:Description rdf:about="http://www.ilrt.bristol.ac.uk/people/cmdjb/">
<dc:title>{title}</dc:title>
<dc:creator>{creator}</dc:creator>
<dc:publisher>{publisher}</dc:publisher>

<dc:date>2020-01-03T14:23:51.018Z</dc:date>
</rdf:Description>
</rdf:RDF>
</metadata>
<application
    title="testapp"
    logo=""
    help=""
    style="css/themes/default.css"
    exportpng="false"
    showhelp="false"
    coordinates="false"
    measuretools="false"
    togglealllayersfromtheme="false">
</application>
<mapoptions maxzoom="20" projection="EPSG:3857" center="-307903.74898791354,6141345.088741366" zoom="7" />
<proxy url='../proxy/?url='/>
<searchparameters bbox="false" localities="false" features="false" static="false"/>
<baselayers style="default">
    <baselayer visible="true" id="osm_grey" thumbgallery="img/basemap/osm_grey.png" title="GéoBretagne - DataGrandEst" label="OpenStreetMap style noir et blanc" type="WMTS" url="GéoBretagne - DataGrandEst. Données : les contributeurs d'<a href=\"https://www.openstreetmap.org/\" target=\"_blank\">OpenStreetMap </a>,  <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\">ODbL </a>"  ></baselayer>
    <baselayer visible="false" id="esriworldimagery" thumbgallery="img/basemap/esriworldwide.jpg" title="Esri" label="Esri world imagery" type="OSM" url="http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile" attribution="Esri world imagery"  ></baselayer>
</baselayers>
<themes mini="false">
</themes>
</config>
"""


@pytest.fixture
def cleandir():
    yield
    shutil.rmtree(Path("./store"), ignore_errors=True)


@pytest.fixture
def client():
    app = create_app()
    app.testing = True
    with app.test_client() as c:
        yield c


@pytest.fixture
def header_client1():
    return {
        "sec-username": "foo",
        "sec-org": "bar",
        "sec-roles": "USER;SUPERUSER",
        "sec-firstname": "baz",
        "sec-lastname": "baf",
    }


@pytest.fixture
def header_client2():
    return {
        "sec-username": "toto",
        "sec-org": "titi",
        "sec-roles": "USER;SUPERUSER",
        "sec-firstname": "tata",
        "sec-lastname": "bibi",
    }


@pytest.mark.usefixtures("cleandir")
class TestAuthenticationUser:
    def test_no_headers(self):
        app = create_app()
        app.testing = True
        with app.test_request_context("/"):
            c = _get_current_user()
            assert isinstance(c, User)
            assert c.username == "anonymous"
            assert c.firstname == "anonymous"
            assert c.lastname == "anonymous"
            assert c.organisation == "public"
            assert c.roles == [""]

    def test_headers(self):
        app = create_app()
        app.testing = True
        headers = {
            "sec-username": "foo",
            "sec-org": "bar",
            "sec-roles": "USER;SUPERUSER",
            "sec-firstname": "baz",
        }
        with app.test_request_context("/", headers=headers):
            c = _get_current_user()
            assert isinstance(c, User)
            assert c.username == "foo"
            assert c.organisation == "bar"
            assert c.roles == ["USER", "SUPERUSER"]
            assert c.firstname == "baz"
            # this should not happened IRL.
            assert c.lastname == "anonymous"

    def test_keycloak_headers(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_TYPE"] = "keycloak"
        headers = {
            "X-Forwarded-Preferred-Username": "foo",
            "X-Forwarded-Given-Name": "baz",
            "X-Forwarded-Family-Name": "baf",
            "X-Forwarded-Org": "bar",
            "X-Forwarded-Roles": "USER,ADMIN",
        }
        with app.test_request_context("/", headers=headers):
            c = _get_current_user()
            assert isinstance(c, User)
            assert c.username == "foo"
            assert c.organisation == "bar"
            assert c.roles == ["USER", "ADMIN"]
            assert c.firstname == "baz"
            assert c.lastname == "baf"


class TestUserInfos:
    def test_anonymous(self, client):
        r = client.get("/srv/user_info")
        assert r.status_code == 200
        assert isinstance(r.json, dict)
        assert r.json == {
            "first_name": "anonymous",
            "last_name": "anonymous",
            "organisation": {"legal_name": None},
            "roles": [""],
            "user_name": "anonymous",
        }

    def test_client1(self, client, header_client1):
        r = client.get("/srv/user_info", headers=header_client1)
        assert r.status_code == 200
        assert isinstance(r.json, dict)
        assert r.json == {
            "first_name": "baz",
            "last_name": "baf",
            "organisation": {"legal_name": "bar"},
            "roles": ["USER", "SUPERUSER"],
            "user_name": "foo",
        }


class TestKeycloakAccessProtection:
    def test_keycloak_access_requires_authenticated_user(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_TYPE"] = "keycloak"
        with app.test_client() as client:
            r = client.get("/api/user")
            assert r.status_code == 401

    def test_keycloak_access_allows_authenticated_user(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_TYPE"] = "keycloak"
        with app.test_client() as client:
            r = client.get(
                "/api/user",
                headers={
                    "X-Forwarded-Preferred-Username": "foo",
                    "X-Forwarded-Roles": "VIEWER",
                },
            )
            assert r.status_code == 200
            assert r.json["user_name"] == "foo"

    def test_oidc_alias_requires_authenticated_user(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_TYPE"] = "oidc"
        with app.test_client() as client:
            r = client.get("/api/user")
            assert r.status_code == 401


class TestAuthenticationModes:
    def test_public_mode_keeps_api_user_public(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "public"
        with app.test_client() as client:
            response = client.get("/api/user")
            assert response.status_code == 200
            assert response.json["user_name"] == "anonymous"

    def test_proxy_mode_requires_forwarded_identity(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "proxy"
        with app.test_client() as client:
            response = client.get("/api/user")
            assert response.status_code == 401

    def test_authlib_mode_uses_session_claims(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "authlib"
        with app.test_client() as client:
            with client.session_transaction() as flask_session:
                flask_session["mviewerstudio.auth.claims"] = {
                    "preferred_username": "alice",
                    "given_name": "Alice",
                    "family_name": "Martin",
                    "organization": "acme",
                    "roles": ["EDITOR"],
                }

            response = client.get("/api/user")
            assert response.status_code == 200
            assert response.json["user_name"] == "alice"
            assert response.json["roles"] == ["EDITOR"]
            assert response.json["auth_mode"] == "authlib"

    def test_authlib_mode_denies_authenticated_user_without_allowed_group(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "authlib"
        app.config["MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS"] = "ADMIN,OPS"
        with app.test_client() as client:
            with client.session_transaction() as flask_session:
                flask_session["mviewerstudio.auth.claims"] = {
                    "preferred_username": "alice",
                    "given_name": "Alice",
                    "family_name": "Martin",
                    "organization": "acme",
                    "roles": ["EDITOR"],
                }

            response = client.get("/api/user")
            assert response.status_code == 403
            assert response.json["error"] == "authorization_required"
            assert response.json["allowed_groups"] == ["ADMIN", "OPS"]
            assert response.json["user_groups"] == ["EDITOR"]

    def test_authlib_mode_allows_authenticated_user_with_allowed_group(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "authlib"
        app.config["MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS"] = "ADMIN,EDITOR"
        with app.test_client() as client:
            with client.session_transaction() as flask_session:
                flask_session["mviewerstudio.auth.claims"] = {
                    "preferred_username": "alice",
                    "given_name": "Alice",
                    "family_name": "Martin",
                    "organization": "acme",
                    "roles": ["EDITOR"],
                }

            response = client.get("/api/user")
            assert response.status_code == 200
            assert response.json["user_name"] == "alice"

    def test_authlib_mode_api_user_returns_login_url_when_anonymous(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "authlib"
        with app.test_client() as client:
            response = client.get(
                "/api/user",
                headers={"X-Auth-Return-To": "https://example.test/mviewerstudio/index.html"},
            )
            assert response.status_code == 401
            assert response.json["error"] == "authentication_required"
            assert response.json["redirect_url"] == "http://localhost/"
            assert (
                response.json["login_url"]
                == "/auth/login?next=https://example.test/mviewerstudio/index.html"
            )


class TestAuthlibClaimNormalization:
    def test_normalize_claims_accepts_django_aliases(self):
        claims = normalize_claims(
            {
                "sub": "1049",
                "username": "alice",
                "first_name": "Alice",
                "last_name": "Martin",
                "organisation": "acme",
                "groups": ["EDITOR", "CATALOG"],
            }
        )

        assert claims == {
            "preferred_username": "alice",
            "email": None,
            "name": None,
            "given_name": "Alice",
            "family_name": "Martin",
            "organization": "acme",
            "roles": ["EDITOR", "CATALOG"],
            "sub": "1049",
        }

    def test_normalize_claims_accepts_string_group_lists(self):
        claims = normalize_claims(
            {
                "preferred_username": "1049",
                "username": "alice",
                "first_name": "Alice",
                "last_name": "Martin",
                "group_list_all": "EDITOR,CATALOG",
            }
        )

        assert claims["preferred_username"] == "alice"
        assert claims["given_name"] == "Alice"
        assert claims["family_name"] == "Martin"
        assert claims["roles"] == ["EDITOR", "CATALOG"]

    def test_normalize_claims_uses_configured_groups_claim(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "authlib"
        app.config["MVIEWERSTUDIO_AUTHLIB_GROUPS_CLAIM"] = "member_of"
        with app.app_context():
            claims = normalize_claims(
                {
                    "preferred_username": "alice",
                    "member_of": ["UMRLISA", "MVIEWER"],
                }
            )

        assert claims["roles"] == ["UMRLISA", "MVIEWER"]

    def test_allowed_authlib_groups_parses_csv_and_semicolon(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS"] = "UMRLISA, MVIEWER;ADMIN"
        with app.app_context():
            assert allowed_authlib_groups() == ["UMRLISA", "MVIEWER", "ADMIN"]

    def test_authlib_logout_fetches_metadata_when_worker_has_none(self, monkeypatch):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTHLIB_ISSUER"] = "https://idp.example.test/o"

        class FakeAuthlibClient:
            server_metadata = {}

        class FakeDiscoveryResponse:
            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, traceback):
                return False

            def read(self):
                return b'{"end_session_endpoint": "https://idp.example.test/o/logout"}'

        monkeypatch.setattr(
            authlib_service.oauth,
            "create_client",
            lambda name: FakeAuthlibClient(),
        )
        monkeypatch.setattr(
            authlib_service,
            "urlopen",
            lambda url, timeout: FakeDiscoveryResponse(),
        )

        with app.test_request_context("/logout", base_url="https://studio.example.test/"):
            authlib_service.session[authlib_service.AUTHLIB_SESSION_TOKEN_KEY] = {
                "id_token": "token-id"
            }

            logout_url = authlib_service.build_authlib_logout_redirect()

        assert logout_url.startswith("https://idp.example.test/o/logout?")
        assert "id_token_hint=token-id" in logout_url
        assert "post_logout_redirect_uri=https%3A%2F%2Fstudio.example.test%2F" in logout_url

    def test_authlib_logout_prefers_configured_end_session_endpoint(self, monkeypatch):
        app = create_app()
        app.testing = True
        app.config["OIDC_END_SESSION_ENDPOINT"] = "https://idp.example.test/account/logout/"

        class FakeAuthlibClient:
            server_metadata = {}

        monkeypatch.setattr(
            authlib_service.oauth,
            "create_client",
            lambda name: FakeAuthlibClient(),
        )

        with app.test_request_context("/logout", base_url="https://studio.example.test/"):
            logout_url = authlib_service.build_authlib_logout_redirect()

        assert logout_url.startswith("https://idp.example.test/account/logout/?")
        assert "post_logout_redirect_uri=https%3A%2F%2Fstudio.example.test%2F" in logout_url

    def test_authlib_mode_prefixed_api_user_returns_login_url_when_anonymous(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "authlib"
        app.config["MVIEWERSTUDIO_URL_PATH_PREFIX"] = "mviewerstudio"
        with app.test_client() as client:
            response = client.get(
                "/mviewerstudio/api/user",
                headers={"X-Auth-Return-To": "https://example.test/mviewerstudio/index.html"},
            )
            assert response.status_code == 401
            assert response.json["error"] == "authentication_required"
            assert response.json["redirect_url"] == "http://localhost/"
            assert (
                response.json["login_url"]
                == "/mviewerstudio/auth/login?next=https://example.test/mviewerstudio/index.html"
            )

    def test_authlib_mode_root_redirects_anonymous_user_to_login(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "authlib"
        app.config["MVIEWERSTUDIO_URL_PATH_PREFIX"] = "mviewerstudio"
        with app.test_client() as client:
            response = client.get("/mviewerstudio")
            assert response.status_code == 302
            assert (
                response.headers["Location"]
                == "/mviewerstudio/auth/login?next=http://localhost/mviewerstudio"
            )

    def test_authlib_mode_index_redirects_anonymous_user_to_login(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "authlib"
        app.config["MVIEWERSTUDIO_URL_PATH_PREFIX"] = "mviewerstudio"
        with app.test_client() as client:
            response = client.get("/mviewerstudio/index.html")
            assert response.status_code == 302
            assert (
                response.headers["Location"]
                == "/mviewerstudio/auth/login?next=http://localhost/mviewerstudio/index.html"
            )

    def test_authlib_mode_global_guard_redirects_anonymous_index_to_login(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "authlib"
        app.config["MVIEWERSTUDIO_URL_PATH_PREFIX"] = "mviewerstudio"
        with app.test_client() as client:
            response = client.get(
                "/mviewerstudio/index.html",
                follow_redirects=False,
            )
            assert response.status_code == 302
            assert (
                response.headers["Location"]
                == "/mviewerstudio/auth/login?next=http://localhost/mviewerstudio/index.html"
            )

    def test_authlib_mode_index_serves_html_for_authenticated_user(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "authlib"
        app.config["MVIEWERSTUDIO_URL_PATH_PREFIX"] = "mviewerstudio"
        with app.test_client() as client:
            with client.session_transaction() as flask_session:
                flask_session["mviewerstudio.auth.claims"] = {
                    "preferred_username": "alice",
                    "given_name": "Alice",
                    "family_name": "Martin",
                    "organization": "acme",
                    "roles": ["EDITOR"],
                }

            response = client.get("/mviewerstudio/index.html")
            assert response.status_code == 200
            assert "text/html" in response.content_type

    def test_authlib_mode_root_serves_403_error_page_for_disallowed_user(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "authlib"
        app.config["MVIEWERSTUDIO_URL_PATH_PREFIX"] = "mviewerstudio"
        app.config["MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS"] = "UMRLISA"
        with app.test_client() as client:
            with client.session_transaction() as flask_session:
                flask_session["mviewerstudio.auth.claims"] = {
                    "preferred_username": "alice",
                    "given_name": "Alice",
                    "family_name": "Martin",
                    "organization": "acme",
                    "roles": ["Partenaire"],
                }

            response = client.get("/mviewerstudio/")
            assert response.status_code == 403
            assert "text/html" in response.content_type
            response_text = response.get_data(as_text=True)
            assert "Accès refusé" in response_text
            assert "Votre compte est authentifié" in response_text

    def test_authlib_mode_error_css_is_served_for_disallowed_user(self):
        app = create_app()
        app.testing = True
        app.config["MVIEWERSTUDIO_AUTH_MODE"] = "authlib"
        app.config["MVIEWERSTUDIO_URL_PATH_PREFIX"] = "mviewerstudio"
        app.config["MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS"] = "UMRLISA"
        with app.test_client() as client:
            with client.session_transaction() as flask_session:
                flask_session["mviewerstudio.auth.claims"] = {
                    "preferred_username": "alice",
                    "given_name": "Alice",
                    "family_name": "Martin",
                    "organization": "acme",
                    "roles": ["Partenaire"],
                }

            response = client.get("/mviewerstudio/css/errors.css")
            assert response.status_code == 200
            assert "text/css" in response.content_type
            assert b"--error-bg" in response.data


@pytest.mark.usefixtures("cleandir")
class TestStoreMviewerConfig:
    def test_store(self, client, header_client1):
        client_data = test_xml.format(
            title="test_store1", creator="test_user", publisher="test_publisher"
        )
        filehash = hashlib.md5()
        filehash.update(client_data.encode("utf-8"))
        filehash = filehash.hexdigest()
        p = client.post("/srv/store", data=client_data, headers=header_client1)
        assert p.status_code == 200
        assert p.json == {"filepath": f"{filehash}.xml", "success": True}
        assert len(os.listdir("./store")) == 2
        assert f"{filehash}.xml" in os.listdir("./store")


@pytest.mark.usefixtures("cleandir")
class TestListStoredMviewerConfig:
    def test_list_one(self, client, header_client1):
        """
        create a file and list it.
        """
        client_data = test_xml.format(
            title="test_store2", creator="foo", publisher="test_publisher"
        )
        client.post("/srv/store", data=client_data, headers=header_client1)
        r = client.get("/srv/list", headers=header_client1)
        assert r.status_code == 200
        assert r.json == [
            {
                "creator": "foo",
                "date": "2020-01-03T14:23:51.018Z",
                "subjects": None,
                "title": "test_store2",
                "url": "apps/store//96b9de867f1f367c2aadabf02c96f626.xml",
            }
        ]

    def test_list_different_user(self, client, header_client1, header_client2):
        """
        Create a file with user1, and listing with user2 should return no file created
        by user2
        """
        client_data = test_xml.format(
            title="test_store3", creator="test_user", publisher="test_publisher"
        )
        client.post("/srv/store", data=client_data, headers=header_client1)
        r = client.get("/srv/list", headers=header_client2)
        assert r.status_code == 200
        assert r.json == []

    def test_wrong_file_type(self, client, header_client1):
        """
        Wrong configuration can sometime lead to wrongly formated xml file.
        """
        with open("./store/wrongfile", "w") as f:
            f.write("this is wrong content")
        client_data = test_xml.format(
            title="test_store3", creator="foo", publisher="test_publisher"
        )
        client.post("/srv/store", data=client_data, headers=header_client1)
        r = client.get("/srv/list", headers=header_client1)
        assert r.status_code == 200
        assert len(os.listdir("./store")) == 3
        assert r.json == [
            {
                "creator": "foo",
                "date": "2020-01-03T14:23:51.018Z",
                "subjects": None,
                "title": "test_store3",
                "url": "apps/store//771b7365e54bb9bb29ee129ff8198188.xml",
            }
        ]


@pytest.mark.usefixtures("cleandir")
class TestDeleteMviewerConfig:
    def test_delete_one(self, client, header_client1, header_client2):
        """
        Create two file, with 2 users, call `delete` endpoint, with user 1.
        It should only delete 1 file.
        """
        client1_data = test_xml.format(
            title="test_store4", creator="foo", publisher="test_publisher"
        )
        client.post("/srv/store", data=client1_data, headers=header_client1)
        client2_data = test_xml.format(
            title="test_store5", creator="toto", publisher="test_publisher"
        )
        client.post("/srv/store", data=client2_data, headers=header_client2)
        r = client.get("/srv/delete", headers=header_client1)
        assert r.status_code == 200
        assert r.json == {"deleted_files": 1}
        # file of user2 should remain.
        assert len(os.listdir("./store")) == 2
