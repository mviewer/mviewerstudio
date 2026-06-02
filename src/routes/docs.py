from os import path

from flask import jsonify, redirect, render_template_string, send_from_directory
from flask.typing import ResponseReturnValue

from ..utils.login_utils import current_user
from .shared import basic_store


@basic_store.route("/")
def default_doc():
    return redirect("index.html")


@basic_store.route("/swagger", methods=["GET"])
@basic_store.route("/swagger/", methods=["GET"])
def swagger_ui() -> ResponseReturnValue:
    return render_template_string("""
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MviewerStudio API - Swagger</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        url: "swagger.yaml",
        dom_id: "#swagger-ui"
      });
    </script>
  </body>
</html>
        """)


@basic_store.route("/swagger.yaml", methods=["GET"])
def swagger_spec() -> ResponseReturnValue:
    return send_from_directory(path.dirname(path.dirname(__file__)), "swagger.yaml")


@basic_store.route("/api/user", methods=["GET"])
def user() -> ResponseReturnValue:
    return jsonify(current_user.as_dict())
