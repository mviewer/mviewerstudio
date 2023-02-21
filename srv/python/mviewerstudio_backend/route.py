from flask import Blueprint, jsonify, Response, request, current_app, redirect
from .utils.login_utils import current_user
from .utils.config_utils import Config
import hashlib
from os import path, mkdir
from glob import glob
import lxml.etree as ET
from pathlib import Path
from flask.blueprints import BlueprintSetupState
from urllib.parse import urlparse
import requests

import logging

basic_store = Blueprint(
    "basic-store", __name__, static_folder="static", static_url_path="/"
)

logger = logging.getLogger(__name__)


@basic_store.record_once
def basic_store_init(state: BlueprintSetupState):
    p = state.app.config["EXPORT_CONF_FOLDER"]
    styles_path = path.join(p, "styles")
    if not path.exists(p):
        mkdir(p)
    if not path.exists(styles_path):
        mkdir(styles_path)


@basic_store.route("/")
def default_doc():
    return redirect("index.html")


@basic_store.route("/srv/user_info", methods=["GET"])
def user() -> Response:
    return jsonify(current_user.as_dict())


@basic_store.route("/srv/store", methods=["POST"])
def store_mviewer_config() -> Response:
    config = Config(
        request.data,
        current_user,
        current_app
    )

    config_data = config.as_data()
    current_config = current_app.register.read(config_data.id)
    if not current_config:
        current_app.register.add(config_data)

    response = jsonify({"success": True, "filepath": config_data.url, "config": config_data})

    return response



@basic_store.route("/srv/list", methods=["GET"])
def list_stored_mviewer_config() -> Response:
    """
    Return all mviewer config created by the current user
    """

    configs = current_app.register.as_dict()["configs"]
    for config in configs:
        config["url"] = current_app.config["CONF_PATH_FROM_MVIEWER"] + config["url"]
    return jsonify(configs)


@basic_store.route("/srv/delete", methods=["GET"])
def delete_mviewer_config() -> Response:
    """
    Delete all the mviewer config of the user logged
    """
    nb_file_deleted = 0
    filepath = os.path.join(current_app.config["EXPORT_CONF_FOLDER"], "*.xml")
    files = glob(filepath)
    for f in files:
        xml = ET.parse(f)
        description = xml.find(".//metadata/{*}RDF/{*}Description")
        if description.find(".//{*}creator").text == current_user.username:
            Path(f).unlink()
            nb_file_deleted += 1
    return jsonify({"deleted_files": nb_file_deleted})


@basic_store.route("/srv/store/style", methods=["POST"])
def store_style() -> Response:
    """
    This endpoint stores SLD style locally. it does not verify the content.
    """
    raw_style = request.data.decode("utf-8")
    filehash = hashlib.sha256()
    filehash.update(raw_style.encode("utf-8"))
    filename = f"{filehash.hexdigest()}.sld"
    absolute_path = os.path.join(
        current_app.config["EXPORT_CONF_FOLDER"], "styles", filename
    )
    with open(absolute_path, "w") as f:
        f.write(raw_style)
    return jsonify(
        {
            "success": True,
            "filepath": os.path.join(
                current_app.config["CONF_PATH_FROM_MVIEWER"], "styles", filename
            ),
        }
    )


@basic_store.route("/proxy/", methods=["GET", "POST"])
def proxy() -> Response:
    url = request.args.get("url")
    if url:
        parsed_url = urlparse(url)
        origin = parsed_url.netloc
        white_list = current_app.config["PROXY_WHITE_LIST"]
        if origin in white_list:
            headers = request.headers
            if request.method == "GET":
                response = requests.get(url).content
            elif request.method == "POST":
                xml = request.stream.read()
                headers = {"Content-Type": "application/xml; charset=UTF-8"}
                response = requests.post(url, data=xml, headers=headers).content
            else:
                response = "Method Not allowed"
        else:
            response = "Not allowed"
    else:
        response = "Interdit"
    return response
