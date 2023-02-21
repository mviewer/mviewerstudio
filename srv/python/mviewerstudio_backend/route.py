from flask import Blueprint, jsonify, Response, request, current_app, redirect
from .utils.login_utils import current_user
from .utils.config_utils import Config
import hashlib
from os import path, mkdir
from shutil import rmtree
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


@basic_store.route("/srv/delete", methods=["POST"])
def delete_configs_workspace() -> Response:
    
    data = request.get_json()
    
    if not data["ids"]:
        return jsonify(message="Nothing to delete !"), 204
    
    for id in data:
        delete_config_workspace(id)
    
    return jsonify({"deleted_files": len(data["ids"]), "success": True, "message": "Configs removed !"})

@basic_store.route("/srv/<string:id>", methods=["DELETE"])
def delete_config_workspace(id) -> Response:
    """
    Delete one mviewer config
    """
    register = current_app.register
    
    configs = register.read(id)
    if not configs :
        return jsonify({"deleted_files": 0, "success": False}), 204

    # update json
    register.delete(configs[0])
    # delete directory
    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], id)
    rmtree(workspace)
    return jsonify({"deleted_files": 1, "success": True})
  
@basic_store.route("/srv/clean", methods=["DELETE"])
def delete_all_mviewer_config() -> Response:
    """
    Delete all the mviewer config of the user logged
    """
    register = current_app.register.register
    count = 0
    for config in register.configs :
        id = config.id
        delete_config_workspace(id)
        count += 1
    return jsonify({"deleted_files": count, "success": True, "message": "Workspace is clean and empty !"})


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
