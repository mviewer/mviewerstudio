from flask import Blueprint, jsonify, Response, request, current_app, redirect
from .utils.login_utils import current_user
from .utils.config_utils import Config
import hashlib
from os import path, mkdir
from shutil import rmtree
from flask.blueprints import BlueprintSetupState
from urllib.parse import urlparse
import requests
from .utils.git_utils import Git_manager

from werkzeug.exceptions import BadRequest, MethodNotAllowed

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

@basic_store.route("/srv/config", methods=["POST"])
def store_mviewer_config() -> Response:
    config = Config(
        request.data,
        current_user,
        current_app
    )
    if not config.xml:
        raise BadRequest("No XML found in the request body !")
    
    config_data = config.as_data()
    current_config = current_app.register.read(config_data.id)
    if not current_config:
        current_app.register.add(config_data)

    return jsonify({"success": True, "filepath": config_data.url, "config": config_data})


@basic_store.route("/srv/list", methods=["GET"])
def list_stored_mviewer_config() -> Response:
    """
    Return all mviewer config created by the current user
    """

    configs = current_app.register.as_dict()["configs"]
    for config in configs:
        config["url"] = current_app.config["CONF_PATH_FROM_MVIEWER"] + config["url"]
    return jsonify(configs)


@basic_store.route("/srv/list", methods=["DELETE"])
def delete_configs_workspace() -> Response:
    
    data = request.get_json()
    
    if not data["ids"]:
        raise BadRequest("Nothing to delete !")
    
    for id in data:
        delete_config_workspace(id)
    
    return jsonify({"deleted_files": len(data["ids"]), "success": True, "message": "Configs removed !"})

@basic_store.route("/srv/config/<id>", methods=["DELETE"])
def delete_config_workspace(id) -> Response:
    """
    Delete one mviewer config
    """
    register = current_app.register
    
    configs = register.read(id)
    if not configs :
        raise BadRequest("Version's ID does not exists !")

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
                raise MethodNotAllowed("Not allowed !")
        else:
            raise MethodNotAllowed("Not allowed !")
    else:
        raise BadRequest("Missing param : url")
    return response

@basic_store.route("/srv/version/<id>/<version>", methods=["GET"])
def change_config_version(id, version = "1") -> Response:
    '''
    Allow to change version to test another
    '''
    # read GET params from URL
    as_new = request.args.get('as_new', default=False, type=bool)
    config =  current_app.register.read(id)
    if not version or version == "1":
        as_new = True
    if config:
        workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config[0].id)
        git = Git_manager(workspace)
        git.switch_version(version, as_new)
        return jsonify({"success": True, "message": "Version changes !"}), 200
    else :
        raise BadRequest("This config doesn't exists !")

@basic_store.route("/srv/version/<id>/<version>", methods=["DELETE"])
def delete_config_version(id, version) -> Response:
    '''
    Allow to change version to test another
    '''
    config =  current_app.register.read(id)
    if config:
        workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config[0].id)
        git = Git_manager(workspace)
        git.delete_version(version)
        return jsonify({"success": True, "message": "Version changes !"}), 200
    else :
        raise BadRequest("This config doesn't exists !")

@basic_store.route("/srv/version/<id>", methods=["DELETE"])
def delete_all_config_version(id) -> Response:
    '''
    Allow to change version to test another
    '''
    config =  current_app.register.read(id)
    if config:
        workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config[0].id)
        git = Git_manager(workspace)
        git.delete_versions()
        return jsonify({"success": True, "message": "Version changes !"}), 200
    else :
        raise BadRequest("This config doesn't exists !")
    
@basic_store.route("/srv/version/<id>", methods=["POST"])
def create_config_version(id) -> Response:
    config =  current_app.register.read(id)
    if config:
        workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config[0].id)
        git = Git_manager(workspace)
        git.create_version()
        return jsonify({"success": True, "message": "New version created !"}), 200
    else :
        raise BadRequest("This config doesn't exists !")
