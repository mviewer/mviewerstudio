"""Check the Grist proxy without contacting an external service."""
import tempfile
import unittest
from unittest.mock import patch

import requests
from flask import Flask

from .app_factory import load_blueprint
from .settings import Config
from .utils.grist_join import get_grist_api_url


class GristProxyTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.app = Flask(__name__)
        self.app.config.from_object(Config)
        self.app.config.update(
            EXPORT_CONF_FOLDER=directory.name,
            GRIST_API_URL="https://grist.example.org",
            TESTING=True,
            MVIEWERSTUDIO_URL_PATH_PREFIX="/studio/",
        )
        load_blueprint(self.app)
        self.client = self.app.test_client()

    def test_forward_methods_body_query_and_token(self):
        for method in ("GET", "POST", "PUT", "PATCH", "DELETE"):
            with self.subTest(method=method), patch("src.proxy_grist.requests.request") as send:
                upstream = requests.Response()
                upstream.status_code = 403
                upstream._content = b'{"error":"denied"}'
                upstream._content_consumed = True
                upstream.headers["Content-Type"] = "application/json"
                upstream.headers["Set-Cookie"] = "upstream=private"
                send.return_value = upstream
                self.client.set_cookie("session", "private")
                response = self.client.open(
                    "/studio/grist/api/docs/doc/tables/Table/records?limit=2&x=a%2Bb",
                    method=method,
                    data=b'{"records":[]}',
                    headers={"Authorization": "Bearer test-token", "Content-Type": "application/json"},
                )
                self.assertEqual(response.status_code, 403)
                self.assertEqual(response.json, {"error": "denied"})
                self.assertNotIn("Set-Cookie", response.headers)
                self.assertEqual(response.headers["Cache-Control"], "no-store")
                args, kwargs = send.call_args
                self.assertEqual(args, (method, "https://grist.example.org/api/docs/doc/tables/Table/records"))
                self.assertEqual(kwargs["params"], b"limit=2&x=a%2Bb")
                self.assertEqual(kwargs["data"], b'{"records":[]}')
                self.assertEqual(kwargs["headers"]["Authorization"], "Bearer test-token")
                self.assertNotIn("Cookie", kwargs["headers"])
                self.assertFalse(kwargs["allow_redirects"])
                self.assertEqual(kwargs["timeout"], self.app.config["GRIST_PROXY_TIMEOUT"])

    def test_network_errors(self):
        for error, status in ((requests.Timeout(), 504), (requests.ConnectionError(), 502)):
            with self.subTest(status=status), patch("src.proxy_grist.requests.request", side_effect=error):
                self.assertEqual(self.client.get("/studio/grist/api/orgs").status_code, status)

    def test_redirect_is_not_exposed(self):
        with patch("src.proxy_grist.requests.request") as send:
            send.return_value.__enter__.return_value = send.return_value
            send.return_value.status_code = 302
            response = self.client.get("/studio/grist/api/orgs")
            self.assertEqual(response.status_code, 502)
            self.assertNotIn("Location", response.headers)

    def test_manual_key_and_path_validation_do_not_call_upstream(self):
        with patch("src.proxy_grist.requests.request") as send:
            self.assertEqual(self.client.get("/studio/grist/api/profile/apikey").status_code, 401)
            self.assertEqual(self.client.get("/studio/grist/api/%2e%2e/admin").status_code, 400)
            send.assert_not_called()

    def test_join_uses_backend_url(self):
        with self.app.app_context():
            self.assertEqual(get_grist_api_url(), "https://grist.example.org")
