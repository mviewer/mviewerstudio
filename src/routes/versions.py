import uuid
from os import path, remove
from shutil import copyfile, copytree, rmtree

from flask import current_app, jsonify, request
from flask.typing import ResponseReturnValue
from werkzeug.exceptions import BadRequest

from ..utils.commons import clean_preview, init_preview
from ..utils.config_utils import replace_templates_url
from ..utils.git_utils import Git_manager
from ..utils.login_utils import current_user
from .shared import _config_register, basic_store


@basic_store.route("/api/app/<id>/versions", methods=["GET"])
def get_all_app_versions(id) -> ResponseReturnValue:
    config = _config_register().read_json(id)
    if not config:
        raise BadRequest("This config doesn't exists !")
    config = config[0]
    org = (
        current_user.normalize_name
        if current_user
        else current_app.config["DEFAULT_ORG"]
    )
    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], org, config["id"])
    git = Git_manager(workspace)
    return jsonify({"versions": git.get_versions(), "config": config})


@basic_store.route("/api/app/<id>/version/<version>", methods=["PUT"])
def switch_app_version(id, version="1") -> ResponseReturnValue:
    as_new = False
    if "as_new" in request.json:
        as_new = request.json["as_new"]
    config = _config_register().read_json(id)

    if not version or version == "1":
        as_new = True
    if not config:
        raise BadRequest("This config doesn't exists !")

    config = config[0]
    workspace = path.join(
        current_app.config["EXPORT_CONF_FOLDER"],
        current_user.normalize_name,
        config["id"],
    )
    git = Git_manager(workspace)
    git.switch_version(version, as_new)
    _config_register().update_from_id(config["id"])
    clean_preview(current_app, config["url"])
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
def preview_app_version(id, version) -> ResponseReturnValue:
    config = _config_register().read_json(id)
    if not config:
        raise BadRequest("This config doesn't exists !")

    config = config[0]
    init_preview(current_app, config["id"])
    workspace = path.join(
        current_app.config["EXPORT_CONF_FOLDER"],
        current_user.normalize_name,
        config["id"],
    )
    git = Git_manager(workspace)
    git.switch_version(version, False)

    app_config = current_app.config
    src_file = path.join(app_config["EXPORT_CONF_FOLDER"], config["url"])
    src_dir = src_file.replace(".xml", "")
    preview_file = path.join(config["id"], "preview", f"{version}.xml")
    path_preview_file = path.join(
        app_config["EXPORT_CONF_FOLDER"], config["publisher"], preview_file
    )
    path_preview_dir = path_preview_file.replace(".xml", "")
    if path.exists(path_preview_dir):
        rmtree(path_preview_dir)
    if path.exists(path_preview_file):
        remove(path_preview_file)
    copyfile(src_file, path_preview_file)
    copytree(src_dir, path_preview_dir)
    relative_publish_dir = path.join(
        current_app.config["CONF_PATH_FROM_MVIEWER"],
        config["publisher"],
        config["id"],
        "preview",
        version,
        "templates",
    )
    replace_templates_url(path_preview_file, relative_publish_dir)
    git.repo.git.checkout("master")

    preview_url = path.join(config["publisher"], preview_file)
    return jsonify({"success": True, "file": preview_url}), 200


@basic_store.route("/api/app/<id>/preview", methods=["POST"])
def preview_uncommited_app(id) -> ResponseReturnValue:
    app_config = current_app.config
    xml = request.data.decode("utf-8")
    xml.replace("anonymous", current_user.username)

    file_name = uuid.uuid1()
    preview_file = path.join(id, "preview", f"{file_name}.xml")
    system_path = path.join(
        app_config["EXPORT_CONF_FOLDER"], current_user.normalize_name, preview_file
    )
    clean_preview(current_app, path.join(current_user.normalize_name, id))
    with open(system_path, "w") as file:
        file.write(xml)
    file_path = path.join(current_user.normalize_name, preview_file)
    return jsonify({"success": True, "file": file_path}), 200


@basic_store.route("/api/app/<id>/version", methods=["DELETE"])
def delete_app_versions(id) -> ResponseReturnValue:
    version_deleted = 0
    post_data = request.json
    if not post_data["versions"]:
        raise BadRequest("Empty list - Nothing to delete !")

    config = _config_register().read_json(id)
    if not config:
        raise BadRequest("This config doesn't exists !")
    config = config[0]
    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config["id"])
    git = Git_manager(workspace)
    for version in post_data["versions"]:
        git.delete_version(version)
        version_deleted += 1

    return jsonify({"success": True, "deleted": version_deleted})


@basic_store.route("/api/app/<id>/version", methods=["POST"])
def create_app_version(id) -> ResponseReturnValue:
    config = _config_register().read_json(id)
    if not config:
        raise BadRequest("This config doesn't exists !")
    config = config[0]
    workspace = path.join(
        current_app.config["EXPORT_CONF_FOLDER"],
        current_user.normalize_name,
        config["id"],
    )
    git = Git_manager(workspace)
    git.create_version(config["description"])
    return jsonify({"success": True, "message": "New version created !"}), 200
