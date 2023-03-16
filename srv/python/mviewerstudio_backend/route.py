from flask import Blueprint, jsonify, Response, request, current_app, redirect
from .utils.login_utils import current_user
from .utils.config_utils import Config
from .utils.commons import clean_preview, init_preview
import hashlib, uuid
from os import path, mkdir, remove
from shutil import rmtree, copyfile
from flask.blueprints import BlueprintSetupState
from urllib.parse import urlparse
import requests
from .utils.git_utils import Git_manager
from .utils.register_utils import from_xml_path

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
    '''
    Return home page.
    '''
    return redirect("index.html")


@basic_store.route("/api/user", methods=["GET"])
def user() -> Response:
    '''
    Return current authentified user.
    Actually works with sec-proxy only.
    '''
    return jsonify(current_user.as_dict())


@basic_store.route("/api/app", methods=["POST"])
def create_mviewer_config() -> Response:
    '''
    Create XML.
    '''
    try:
        config = Config(request.data, current_app)       
    except:
        raise BadRequest("XML seems not correct !")

    if not config.xml:
        raise BadRequest("No XML found in the request body !")
    # commit changes
    config.git.commit_changes("Creation")
    # get data
    config_data = config.as_data()
    # register config
    current_config = current_app.register.read_json(config_data.id)
    if not current_config:
        current_app.register.add(config_data.as_dict())
    # response
    return jsonify(
        {"success": True, "filepath": config_data.url, "config": config_data}
    )

@basic_store.route("/api/app", methods=["PUT"])
def update_mviewer_config() -> Response:
    '''
    Read UUID from XML and update register and local file system if exists.
    '''
    config = Config(request.data, current_app)
    if not config.xml:
        raise BadRequest("No XML found in the request body !")
    # commit changes
    description = config.meta.find("{*}description").text
    if not description:
        description = "Change XML"
    config.git.commit_changes(description)
    # get config as class model data
    config_data = config.as_data()
    # clean preview space if not empty
    clean_preview(current_app, config_data.id)

    current_config = current_app.register.read_json(config_data.id)

    if not current_config:
        raise BadRequest(
            "This config does not exists yet ! Use creation POST request instead."
        )

    current_app.register.update(config_data.as_dict())
    return jsonify(
        {"success": True, "filepath": config_data.url, "config": config_data}
    )


@basic_store.route("/api/app", methods=["GET"])
def list_stored_mviewer_config() -> Response:
    """
    Return all mviewer config created by the current user
    :param search: request args from query param.
    """
    logger.debug("LIST CONFIGS FOR USER : %s " % current_user.username)
    if "search" in request.args:
        pattern = request.args.get("search")
        configs = current_app.register.search_configs(pattern)
    else:
        configs = current_app.register.as_dict()["configs"]
    
    configs = [config for config in configs if config["creator"] == current_user.username]
    
    for config in configs:
        config["url"] = current_app.config["CONF_PATH_FROM_MVIEWER"] + config["url"]
    return jsonify(configs)

@basic_store.route("/api/app/<id>/publish", methods=["GET", "DELETE"])
def publish_mviewer_config(id) -> Response:
    """
    Will put online a config.
    This route will copy / past XML to publication directory or delete to unpublish.
    :param id: configuration UUID
    """
    logger.debug("PUBLISH : %s " % id)

    publish_dir = current_app.config["MVIEWERSTUDIO_PUBLISH_PATH"]
    if not publish_dir or not path.exists(publish_dir):
        return BadRequest("Publish directory does not exists !")

    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], id)

    if not path.exists(workspace):
        return BadRequest("Application does not exists !")
    
    config = current_app.register.read_json(id)

    if not config:
        raise BadRequest("This config doesn't exists !")

    copy_file = current_app.config["EXPORT_CONF_FOLDER"] + config[0]["url"]
    config = from_xml_path(current_app, copy_file)

    past_file = path.join(current_app.publish_path, "%s.xml" % id)

    # add publish info in XML
    if request.method == "GET":
        config.xml.set("publish", "true")
        message = "publish"

    # add unpublish info in XML
    if request.method == "DELETE":
        config.xml.set("publish", "false")
        message = "Unpublish"

    config.write()

    # commit to track this action
    config.git.commit_changes(message)

    # update JSON
    config.register.update_from_id(id)

    if path.exists(past_file):
        remove(past_file)

    # move to publish directory
    if request.method == "GET":
        copyfile(copy_file, past_file)

    if request.method == "DELETE":
        past_file=None
    draft_file = current_app.config["CONF_PATH_FROM_MVIEWER"] + config.as_dict()["url"]
    return jsonify({"online_file": past_file, "draft_file": draft_file})

@basic_store.route("/api/app/<id>", methods=["DELETE"])
def delete_config_workspace(id = None) -> Response:
    """
    Delete one mviewer config
    :param id: app UUID
    """
    app_deleted = 0

    if id is None:
        logger.debug("DELETE : ERROR - NO ID TO DELETE")
        raise BadRequest("Empty list : no value to delete !")

    logger.debug("START DELETE CONFIG : %s" % id)
    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], id)
    # update json
    config = current_app.register.read_json(id)
    if not config or not path.exists(workspace):
        logger.debug("DELETE : ERROR - ID OR DIRECTORY NOT EXISTS :")
        return jsonify({"deleted_files": 0, "success": False})

    # control if alowed
    if config[0]["creator"] not in [current_user.username, "anonymous"] :
        logger.debug("DELETE : NOT ALLOWED")
        return MethodNotAllowed("Not allowed !")
    # delete in json
    current_app.register.delete(id)
    # delete dir
    rmtree(workspace)
    app_deleted += 1
    logger.debug("DELETE CONFIG : SUCCESS")
        
    return jsonify({"deleted_files": app_deleted, "success": True})


@basic_store.route("/api/app/<id>/versions", methods=["GET"])
def get_all_app_versions(id) -> Response:
    '''
    Gets all tags and comit for a given UUID application.
    :param id: app UUID
    '''
    config = current_app.register.read_json(id)
    if not config:
        raise BadRequest("This config doesn't exists !")
    config = config[0]
    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config["id"])
    git = Git_manager(workspace)
    versions = git.get_versions()
    return jsonify({"versions": versions, "config": config})


@basic_store.route("/api/app/<id>/version/<version>", methods=["PUT"])
def switch_app_version(id, version="1") -> Response:
    """
    Allow to switch version
    :param id: app UUID
    :param version: 1 by default to witch to master git branch.
    """
    # read GET params from URL
    as_new = False
    if "as_new" in request.json:
        as_new = request.json["as_new"]
    config = current_app.register.read_json(id)

    if not version or version == "1":
        as_new = True

    if not config:
        raise BadRequest("This config doesn't exists !")
    config = config[0]
    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config["id"])
    git = Git_manager(workspace)
    git.switch_version(version, as_new)
    # Update register
    current_app.register.update_from_id(config["id"])
    # clean previews
    clean_preview(current_app, config["id"])
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
    '''
    Allow to copy XML specific version to preview directory.
    :param id: app UUID
    :param version: version to preview as git commit or git tag ref.

    Return file URL to preview.
    '''
    config = current_app.register.read_json(id)
    if not config:
        raise BadRequest("This config doesn't exists !")

    # create preview space
    config = config[0]
    init_preview(current_app, config["id"])
    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config["id"])
    git = Git_manager(workspace)
    git.switch_version(version, False)
    # copy past file to preview folder
    app_config = current_app.config
    src_file = app_config["EXPORT_CONF_FOLDER"] + config["url"]
    preview_file = path.join(config["id"], "preview", "%s.xml" % version)
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
    '''
    Allow to copy create a xml from request.data without save changes.
    This route will create XML in preview directory with random UUID.

    :param id: app UUID
    :param version: version to preview as git commit or git tag ref.

    Return file URL to preview.
    '''
    # init preview
    app_config = current_app.config
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
    Delete each app versions except master branch.

    :param id: app UUID
    
    """
    version_deleted = 0

    post_data = request.json

    if not post_data["versions"]:
        raise BadRequest("Empty list - Nothing to delete !")

    config = current_app.register.read_json(id)
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
def create_app_version(id) -> Response:
    '''
    Create a tag for a given UUID application.
    :param id: app UUID
    '''
    config = current_app.register.read_json(id)
    if not config:
        raise BadRequest("This config doesn't exists !")

    config = config[0]
    workspace = path.join(current_app.config["EXPORT_CONF_FOLDER"], config["id"])
    git = Git_manager(workspace)
    git.create_version(config["description"])
    return jsonify({"success": True, "message": "New version created !"}), 200


@basic_store.route("/api/style", methods=["POST"])
def store_style() -> Response:
    """
    This endpoint stores SLD style locally. It does not verify the content.
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
    '''
    Proxy service.
    :param url: string url to proxify.
    '''
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
