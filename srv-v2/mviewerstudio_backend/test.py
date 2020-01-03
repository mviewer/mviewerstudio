# create a fixture with 3 files, 2 belong to user1 and the other belong to user2.
from .login_utils import _get_current_user, User
import pytest
from .app_factory import create_app
import hashlib

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
    <baselayer visible="true" id="positron" thumbgallery="img/basemap/positron.png" title="CartoDb" label="Positron" type="OSM" url="https://basemaps.cartocdn.com/light_all.png" attribution="Map tiles by  &lt;a href=&quot;https://cartodb.com/attributions&quot;&gt;CartoDb&lt;/a&gt;, under  &lt;a href=&quot;https://creativecommons.org/licenses/by/3.0/&quot;&gt;CC BY 3.0 &lt;/a&gt;"  ></baselayer> 
    <baselayer visible="false" id="esriworldimagery" thumbgallery="img/basemap/esriworldwide.jpg" title="Esri" label="Esri world imagery" type="OSM" url="http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile" attribution="Esri world imagery"  ></baselayer> 
</baselayers>
<themes mini="false"> 
</themes>
</config>
"""


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
            assert c.org is None
            assert c.role == [""]

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
            assert c.org == "bar"
            assert c.role == ["USER", "SUPERUSER"]
            assert c.firstname == "baz"
            # this should not happened IRL.
            assert c.lastname == "anonymous"


class TestUserInfos:
    def test_anonymous(self, client):
        r = client.get("/user_infos.php")
        assert r.status_code == 403
        assert isinstance(r.json, dict)
        assert r.json == {
            "name": "Forbidden",
            "description": "You don't have the permission to access the requested resource. It is either read-protected or not readable by the server.",
        }

    def test_client1(self, client, header_client1):
        r = client.get("/user_infos.php", headers=header_client1)
        assert r.status_code == 200
        assert isinstance(r.json, dict)
        assert r.json == {
            "firstname": "baz",
            "lastname": "baf",
            "org": "bar",
            "role": ["USER", "SUPERUSER"],
            "username": "foo",
        }


class TestStoreMviewerConfig:
    def test_store(self, client, header_client1):
        x = test_xml.format(
            title="test_store", creator="test_user", publisher="test_publisher"
        )
        filehash = hashlib.md5()
        filehash.update(x.encode("utf-8"))
        filehash = filehash.hexdigest()
        p = client.post("/store.php", data=x, headers=header_client1)
        assert p.status_code == 200
        assert p.json == {"filepath": f"{filehash}.xml", "success": True}


class TestListStoredMviewerConfig:
    def test_list_one(self, client, header_client1):
        x = test_xml.format(
            title="test_store", creator="foo", publisher="test_publisher"
        )
        client.post("/store.php", data=x, headers=header_client1)
        r = client.get("/list.php", headers=header_client1)
        assert r.status_code == 200
        assert r.json == [
            {
                "creator": "foo",
                "date": "2020-01-03T14:23:51.018Z",
                "subjects": None,
                "title": "test_store",
                "url": "apps/store//237989e159d5abc0899673bae0eb3cec.xml",
            }
        ]

    def test_list_different_user(self, client, header_client1, header_client2):
        x = test_xml.format(
            title="test_store", creator="test_user", publisher="test_publisher"
        )
        client.post("/store.php", data=x, headers=header_client1)
        r = client.get("/list.php", headers=header_client2)
        assert r.status_code == 200
        assert r.json == []


class TestDeleteMviewerConfig:
    pass
