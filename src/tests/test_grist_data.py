"""Integration tests for real Grist writes through the application's proxy.

Configure grist.local.json to enable them. Each test creates its own table
in the configured document and removes it afterwards, including on failure.
"""

import json
import logging
from pathlib import Path
from urllib.parse import quote, urlsplit
from uuid import uuid4

import pytest
from flask import Flask

from ..app_factory import load_blueprint
from ..settings import Config


CONFIG_PATH = Path(__file__).with_name("grist.local.json")


@pytest.fixture
def grist_config():
    """Load private configuration without exposing it in pytest tracebacks."""
    __tracebackhide__ = True
    if not CONFIG_PATH.exists():
        pytest.skip("Renseigner src/tests/grist.local.json.")
    try:
        config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        pytest.fail("Configuration Grist locale illisible.", pytrace=False)
    if not isinstance(config, dict):
        pytest.fail("La configuration Grist doit être un objet JSON.", pytrace=False)
    required = ("GRIST_API_URL", "GRIST_DOCUMENT_ID", "GRIST_API_KEY")
    for name in required:
        value = config.get(name)
        if not isinstance(value, str) or not value.strip():
            pytest.skip(f"Renseigner {name} dans grist.local.json.")

    try:
        url = urlsplit(config["GRIST_API_URL"])
        valid_url = (
            url.scheme in ("https", "http")
            and url.hostname
            and not url.username
            and not url.password
            and not url.query
            and not url.fragment
        )
    except ValueError:
        valid_url = False
    if not valid_url:
        pytest.fail("GRIST_API_URL doit être une URL HTTP(S) sans identifiants.", pytrace=False)
    return config


@pytest.fixture
def grist_table(grist_config, tmp_path, request):
    """Create an isolated table and register cleanup before yielding it."""
    __tracebackhide__ = True
    previous_logging_level = logging.root.manager.disable
    logging.disable(logging.CRITICAL)
    request.addfinalizer(lambda: logging.disable(previous_logging_level))
    table = GristTestTable(grist_config, tmp_path)
    table.create(request)
    return table


class GristTestTable:
    """Exercise real proxy writes without displaying credentials or bodies."""

    def __init__(self, config, directory):
        __tracebackhide__ = True
        app = Flask(__name__)
        app.config.from_object(Config)
        app.config.update(
            GRIST_API_URL=config["GRIST_API_URL"].rstrip("/"),
            EXPORT_CONF_FOLDER=str(directory),
            MVIEWERSTUDIO_URL_PATH_PREFIX="",
            TESTING=True,
        )
        load_blueprint(app)
        self.client = app.test_client()
        self.api_key = config["GRIST_API_KEY"].strip()
        self.document_path = f"docs/{quote(config['GRIST_DOCUMENT_ID'].strip(), safe='')}"
        self.table_id = f"StudioIntegration_{uuid4().hex}"

    def create(self, request):
        """Create the table and read the identifier assigned by Grist."""
        __tracebackhide__ = True
        payload = self.request_grist(
            "POST",
            f"{self.document_path}/tables",
            {
                "tables": [
                    {
                        "id": self.table_id,
                        "columns": [
                            {"id": "Name", "fields": {"type": "Text"}},
                            {"id": "Value", "fields": {"type": "Int"}},
                        ],
                    }
                ]
            },
        )
        # Register cleanup as soon as creation succeeds, before setup checks.
        request.addfinalizer(self.remove_test_table)
        tables = payload.get("tables", [])
        if len(tables) != 1:
            pytest.fail("Une table de test doit être créée.", pytrace=False)
        self.table_id = tables[0]["id"]
        self.records_path = (
            f"{self.document_path}/tables/{quote(self.table_id, safe='')}/records"
        )

    def request_grist(self, method, path, payload=None):
        """Call the real proxy and report only HTTP status on failure."""
        __tracebackhide__ = True
        try:
            response = self.client.open(
                f"/grist/api/{path}",
                method=method,
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
        except Exception:
            pytest.fail("Impossible d'appeler le proxy Grist.", pytrace=False)
        if not 200 <= response.status_code < 300:
            pytest.fail(
                f"Échec Grist ({method}, HTTP {response.status_code}).", pytrace=False
            )
        result = response.get_json(silent=True)
        if result is None:
            return {}
        return result

    def remove_test_table(self):
        """Remove only the table created by this test, even when assertions fail."""
        self.request_grist(
            "POST", f"{self.document_path}/apply", [["RemoveTable", self.table_id]]
        )

    def send_rows(self):
        """Upload two synthetic rows and return their expected fields."""
        rows = [{"Name": "Alice", "Value": 10}, {"Name": "Bob", "Value": 20}]
        self.request_grist(
            "POST", self.records_path, {"records": [{"fields": row} for row in rows]}
        )
        return rows

    def read_rows(self):
        """Read records back so successful writes are checked in Grist."""
        records = self.request_grist("GET", self.records_path).get("records", [])
        return sorted(records, key=lambda record: record["id"])

    def assert_rows(self, records, expected):
        """Check values without including upstream response contents in failures."""
        actual = [
            {name: record["fields"].get(name) for name in ("Name", "Value")}
            for record in records
        ]
        if actual != expected:
            pytest.fail("Les données relues ne correspondent pas.", pytrace=False)


def test_send_table(grist_table):
    """Case 1: create a table, send rows, then verify stored values."""
    expected = grist_table.send_rows()
    grist_table.assert_rows(grist_table.read_rows(), expected)


def test_update_table(grist_table):
    """Case 2: patch a row, preserving row IDs, count and the other row."""
    expected = grist_table.send_rows()
    before = grist_table.read_rows()
    grist_table.assert_rows(before, expected)
    grist_table.request_grist(
        "PATCH",
        grist_table.records_path,
        {"records": [{"id": before[0]["id"], "fields": {"Value": 42}}]},
    )
    expected[0]["Value"] = 42
    after = grist_table.read_rows()
    grist_table.assert_rows(after, expected)
    if [record["id"] for record in after] != [record["id"] for record in before]:
        pytest.fail(
            "La mise à jour doit conserver les identifiants et le nombre de lignes.",
            pytrace=False,
        )
