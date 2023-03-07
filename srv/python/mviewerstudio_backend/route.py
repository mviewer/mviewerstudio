from flask import Blueprint, jsonify, Response, request, current_app, redirect
from .utils.login_utils import current_user
from .utils.config_utils import Config
import hashlib, uuid
from os import path, mkdir, walk, remove
from shutil import rmtree, copyfile
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


@basic_store.route("/api/user", methods=["GET"])
def user() -> Response:
    return jsonify(current_user.as_dict())


@basic_store.route("/api/app", methods=["POST"])
def save_mviewer_config() -> Response:
    config = Config(request.data, current_user, current_app)
    config_data = config.as_data()

    if not config.xml:
        raise BadRequest("No XML found in the request body !")

    # register config
    current_config = current_app.register.read(config_data.id)
    if not current_config:
        current_app.register.add(config_data)
    # response
    return jsonify(
        {"success": True, "filepath": config_data.url, "config": config_data}
    )


@basic_store.route("/api/app", methods=["PUT"])
def update_mviewer_config() -> Response:
    config = Config(request.data, current_user, current_app)
    if not config.xml:
        raise BadRequest("No XML found in the request body !")
    # clean preview space if not empty
    app_config = current_app.config
    preview_dir = path.join(app_config["EXPORT_CONF_FOLDER"], config_data.id, "preview")
    for (root, dirs, files) in walk(preview_dir):
        if not files:
            break
        for f in files:
            remove(path.join(preview_dir, f))

    config_data = config.as_data()
    current_config = current_app.register.read(config_data.id)

    if not current_config:
        raise BadRequest(
            "This config does not exists yet ! Use creation POST request instead."
        )

    current_app.register.update(config_data)
    return jsonify(
        {"success": True, "filepath": config_data.url, "config": config_data}
    )


@basic_store.route("/api/app", methods=["GET"])
def list_stored_mviewer_config() -> Response:
    """
    Return all mviewer config created by the current user
    """

    if "search" in request.args:
        pattern = request.args.get("search")
        configs = current_app.register.search_configs(pattern)
        configs = [config.as_dict() for config in configs]
    else:
        configs = current_app.register.as_dict()["configs"]
    for config in configs:
        config["url"] = current_app.config["CONF_PATH_FROM_MVIEWER"] + config["url"]
    return jsonify(configs)


def delete_workspace(id):
    register = current_app.register
    config = register.read(id)
    if config:
        # update json
        register.delete(config[0])
        # delete directory
        workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], id)
        rmtree(workspace)


@basic_store.route("/api/app", methods=["DELETE"])
def delete_config_workspace() -> Response:
    """
    Delete one mviewer config
    """
    app_deleted = 0

    post_data = request.json

    if not post_data["ids"]:
        raise BadRequest("Empty list : no value to delete !")

    for id in post_data["ids"]:
        delete_workspace(id)
        app_deleted += 1

    return jsonify({"deleted_files": app_deleted, "success": True})


@basic_store.route("/api/app/<id>/versions", methods=["GET"])
def get_all_app_versions(id) -> Response:
    config = current_app.register.read(id)
    if not config:
        raise BadRequest("This config doesn't exists !")
    config = config[0]
    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config.id)
    git = Git_manager(workspace)
    versions = git.get_versions()
    return jsonify({"versions": versions, "config": config.as_dict()})


@basic_store.route("/api/app/all", methods=["DELETE"])
def delete_all_mviewer_config() -> Response:
    """
    Delete all the mviewer config of the user logged
    """
    register = current_app.register.register
    count = 0
    for config in register.configs:
        id = config.id
        delete_config_workspace(id)
        count += 1
    return jsonify(
        {
            "deleted_files": count,
            "success": True,
            "message": "Workspace is clean and empty !",
        }
    )


@basic_store.route("/api/app/<id>/version/<version>", methods=["PUT"])
def switch_app_version(id, version="1") -> Response:
    """
    Allow to switch version
    """
    # read GET params from URL
    as_new = False
    if "as_new" in request.json:
        as_new = request.json["as_new"]
    config = current_app.register.read(id)

    if not version or version == "1":
        as_new = True

    if not config:
        raise BadRequest("This config doesn't exists !")
    config = config[0]
    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config.id)
    git = Git_manager(workspace)
    git.switch_version(version, as_new)
    current_app.register.update_json()
    # Update register
    config.versions = git.get_versions()
    current_app.register.update(config)
    return (
        jsonify(
            {
                "success": True,
                "message": "Version changes !",
                "detached": git.repo.active_branch.name != "master",
            }
        ),
        200,
    )


@basic_store.route("/api/app/<id>/version/<version>/preview", methods=["GET"])
def preview_app_version(id, version) -> Response:
    config = current_app.register.read(id)
    if not config:
        raise BadRequest("This config doesn't exists !")

    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config[0].id)
    git = Git_manager(workspace)
    git.switch_version(version, False)
    # copy past file to preview folder
    app_config = current_app.config
    src_file = app_config["EXPORT_CONF_FOLDER"] + config[0].url
    preview_file = path.join(config[0].id, "preview", "%s.xml" % version)
    path_preview_file = path.join(app_config["EXPORT_CONF_FOLDER"], preview_file)
    copyfile(src_file, path_preview_file)
    # restor branch
    git.repo.git.checkout("master")

    return (
        jsonify(
            {
                "success": True,
                "file": path.join(app_config["CONF_PATH_FROM_MVIEWER"], preview_file),
            }
        ),
        200,
    )


@basic_store.route("/api/app/<id>/preview", methods=["POST"])
def preview_uncommited_app(id) -> Response:
    # clean preview
    app_config = current_app.config
    preview_dir = path.join(app_config["EXPORT_CONF_FOLDER"], id, "preview")
    for (root, dirs, files) in walk(preview_dir):
        for f in files:
            remove(path.join(preview_dir, f))
    # read XML
    xml = request.data.decode("utf-8")
    xml.replace("anonymous", current_user.username)

    # get file name and path
    file_name = uuid.uuid1()
    preview_file = path.join(id, "preview", "%s.xml" % file_name)
    system_path = path.join(app_config["EXPORT_CONF_FOLDER"], preview_file)

    # store file to preview folder
    with open(system_path, "w") as file:
        file.write(xml)
        file.close()
    # return url
    return (
        jsonify(
            {
                "success": True,
                "file": path.join(app_config["CONF_PATH_FROM_MVIEWER"], preview_file),
            }
        ),
        200,
    )


@basic_store.route("/api/app/<id>/version", methods=["DELETE"])
def delete_app_versions(id) -> Response:
    """
    Delete each app versions
    Only keep main active branch
    """
    version_deleted = 0

    post_data = request.json

    if not post_data["versions"]:
        raise BadRequest("Empty list - Nothing to delete !")

    config = current_app.register.read(id)
    if not config:
        raise BadRequest("This config doesn't exists !")

    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config[0].id)
    git = Git_manager(workspace)

    for version in post_data["versions"]:
        git.delete_version(version)
        version_deleted += 1

    return jsonify({"success": True, "deleted": version_deleted})


@basic_store.route("/api/app/<id>/version", methods=["POST"])
def create_app_version(id) -> Response:
    config = current_app.register.read(id)
    if not config:
        raise BadRequest("This config doesn't exists !")

    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config[0].id)
    git = Git_manager(workspace)
    git.create_version(config[0].description)
    return jsonify({"success": True, "message": "New version created !"}), 200


@basic_store.route("/api/style", methods=["POST"])
def store_style() -> Response:
    """
    This endpoint stores SLD style locally. it does not verify the content.
    """
    raw_style = request.data.decode("utf-8")
    filehash = hashlib.sha256()
    filehash.update(raw_style.encode("utf-8"))
    filename = f"{filehash.hexdigest()}.sld"
    absolute_path = path.join(
        current_app.config["EXPORT_CONF_FOLDER"], "styles", filename
    )
    with open(absolute_path, "w") as f:
        f.write(raw_style)
    return jsonify(
        {
            "success": True,
            "filepath": path.join(
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
