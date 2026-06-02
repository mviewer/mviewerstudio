import hashlib
import xml.etree.ElementTree as ET
from datetime import datetime
from os import mkdir, path, remove
from shutil import copyfile, copytree, rmtree

from flask import current_app, jsonify, request
from flask.typing import ResponseReturnValue
from werkzeug.exceptions import BadRequest, Conflict, MethodNotAllowed

from ..utils.commons import create_zip, make_archive
from ..utils.config_utils import (
    Config,
    control_relation,
    edit_xml_string,
    read_xml_file_content,
    replace_templates_url,
    write_file,
)
from ..utils.login_utils import current_user
from ..utils.register_utils import from_xml_path
from .shared import (
    _config_register,
    _publish_path,
    _xml_text_or_default,
    basic_store,
)


@basic_store.route("/api/app", methods=["POST"])
def create_config() -> ResponseReturnValue:
    try:
        config = Config(request.data, current_app)
    except Exception:
        raise BadRequest("XML seems not correct !")

    if not config.xml:
        raise BadRequest("No XML found in the request body !")

    config.git.commit_changes("Creation")
    config_data = config.as_data()
    current_config = _config_register().read_json(config_data.id)
    if not current_config:
        _config_register().add(config_data.as_dict())
    return jsonify(
        {"success": True, "filepath": config_data.url, "config": config_data}
    )


@basic_store.route("/api/app", methods=["PUT"])
def update_config() -> ResponseReturnValue:
    message = request.args.get("message")
    if not request.data:
        raise BadRequest("No XML found in the request body !")
    config = Config(request.data, current_app)
    if not config:
        raise BadRequest("This XML UUID doesn't exists !")

    description = _xml_text_or_default(config.meta.find("{*}description"))
    if message:
        description = message
    if not description:
        description = "Change XML"

    diff = config.git.repo.git.diff()
    config.git.commit_changes(description)
    config_data = config.as_data()

    from ..utils.commons import clean_preview

    clean_preview(current_app, config_data.url)
    current_config = _config_register().read_json(config_data.id)
    if not current_config:
        raise BadRequest(
            "This config does not exists yet ! Use creation POST request instead."
        )

    _config_register().update(config_data.as_dict())
    return jsonify(
        {
            "success": True,
            "filepath": config_data.url,
            "config": config_data,
            "diff": diff,
        }
    )


@basic_store.route("/api/app", methods=["GET"])
def list_stored_configs() -> ResponseReturnValue:
    if "search" in request.args:
        pattern = request.args.get("search")
        configs = _config_register().search_configs(pattern)
    else:
        configs = _config_register().as_dict()["configs"]

    configs = [
        config
        for config in configs
        if config["publisher"] == current_user.normalize_name
    ]
    for config in configs:
        config["link"] = path.join(
            current_app.config["CONF_PATH_FROM_MVIEWER"], config["url"]
        )
    return jsonify(configs)


@basic_store.route("/api/app/<id>/publish/<name>", methods=["POST", "DELETE"])
def publish_config(id, name) -> ResponseReturnValue:
    xml_publish_name = name
    mviewer_instance = request.args.get("instance")

    if not request.data and request.method == "POST":
        raise BadRequest("Empty request POST data !")

    publish_dir = current_app.config["MVIEWERSTUDIO_PUBLISH_PATH"]
    if not publish_dir or not path.exists(publish_dir):
        raise BadRequest("Publish directory does not exists !")

    org_publish_dir = path.join(_publish_path(), current_user.normalize_name)
    if not path.exists(org_publish_dir):
        mkdir(org_publish_dir)

    past_file = path.join(org_publish_dir, f"{xml_publish_name}.xml")
    past_dir = path.join(org_publish_dir, xml_publish_name)

    if path.exists(past_file) and request.method == "POST":
        if not control_relation(past_file, xml_publish_name, id):
            raise Conflict("Already exists !")
        remove(past_file)
        if path.exists(past_dir):
            rmtree(past_dir)

    workspace = path.join(
        current_app.config["EXPORT_CONF_FOLDER"], current_user.normalize_name, id
    )
    if not path.exists(workspace):
        raise BadRequest("Application does not exists !")

    if request.method == "POST":
        config = Config(request.data, current_app)
    else:
        config_data = _config_register().read_json(id)
        config = from_xml_path(
            current_app,
            path.join(current_app.config["EXPORT_CONF_FOLDER"], config_data[0]["url"]),
        )
    if not config:
        raise BadRequest("This config doesn't exists !")

    if request.method == "POST":
        edit_xml_string(config.meta, "relation", xml_publish_name)
        edit_xml_string(
            config.meta, "date", datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        )
        message = "publication"
    else:
        edit_xml_string(config.meta, "relation", "")
        remove(past_file)
        rmtree(past_dir)
        message = "draft"
        past_file = None

    config.write()
    config.git.create_publication_commit(message)
    config.register.update_from_id(id)

    if request.method == "POST":
        copy_file = path.join(current_app.config["EXPORT_CONF_FOLDER"], config.url)
        copy_dir = copy_file.replace(".xml", "")
        copyfile(copy_file, past_file)
        if path.exists(past_dir):
            rmtree(past_dir)
        copytree(copy_dir, past_dir)
        relative_publish_dir = path.join(
            current_app.config["CONF_PUBLISH_PATH_FROM_MVIEWER"],
            current_user.normalize_name,
            xml_publish_name,
            "templates",
        )
        if mviewer_instance:
            absolute_path = path.join(mviewer_instance, relative_publish_dir)
            replace_templates_url(past_file, absolute_path)

    draft_file = path.join(
        current_app.config["CONF_PATH_FROM_MVIEWER"], config.as_dict()["url"]
    )
    online_file = path.join(current_user.normalize_name, f"{xml_publish_name}.xml")
    return jsonify({"online_file": online_file, "draft_file": draft_file})


@basic_store.route("/api/app/<id>", methods=["DELETE"])
def delete_config_workspace(id=None) -> ResponseReturnValue:
    if id is None:
        raise BadRequest("Empty list : no value to delete !")

    workspace = path.join(
        current_app.config["EXPORT_CONF_FOLDER"], current_user.normalize_name, id
    )
    config = _config_register().read_json(id)
    if not config or not path.exists(workspace):
        return jsonify({"deleted_files": 0, "success": False})

    config = config[0]
    if (
        current_user.username != "anonymous"
        and config["creator"] != current_user.username
    ):
        raise MethodNotAllowed("Not allowed !")
    if (
        current_user.username == "anonymous"
        and config["publisher"] != current_app.config["DEFAULT_ORG"]
    ):
        raise MethodNotAllowed("Not allowed !")

    map_relation = False
    if "relation" in config and config["relation"]:
        publish_name = config["relation"]
        org_publish_dir = path.join(_publish_path(), current_user.normalize_name)
        publish_file = path.join(org_publish_dir, f"{publish_name}.xml")
        map_relation = control_relation(publish_file, publish_name, id)
        if path.exists(publish_file) and map_relation:
            remove(publish_file)
            rmtree(path.join(org_publish_dir, publish_name))
            map_relation = publish_name

    _config_register().delete(id)
    rmtree(workspace)
    return jsonify(
        {"deleted_files": 1, "success": True, "deleted_publish": map_relation}
    )


@basic_store.route("/api/style", methods=["POST"])
def store_style() -> ResponseReturnValue:
    raw_style = request.data.decode("utf-8")
    filehash = hashlib.sha256()
    filehash.update(raw_style.encode("utf-8"))
    filename = f"{filehash.hexdigest()}.sld"
    absolute_path = path.join(
        current_app.config["EXPORT_CONF_FOLDER"], "styles", filename
    )
    with open(absolute_path, "w") as file:
        file.write(raw_style)
    return jsonify(
        {
            "success": True,
            "filepath": path.join(
                current_app.config["CONF_PATH_FROM_MVIEWER"], "styles", filename
            ),
        }
    )


@basic_store.route("/api/app/<id>/template/<file_name>", methods=["POST"])
def add_layer_template(id, file_name) -> ResponseReturnValue:
    template = request.data.decode("utf-8")
    config = _config_register().read_json(id)
    if not config:
        raise BadRequest("This config doesn't exists !")
    config = config[0]
    draftspace = path.join(
        current_app.config["EXPORT_CONF_FOLDER"],
        current_user.normalize_name,
        config["id"],
    )
    templates_dir = path.join(draftspace, config["directory"], "templates")
    if not path.exists(templates_dir):
        mkdir(templates_dir)
    draft_templates = path.join(templates_dir, f"{file_name}.mst")
    with open(draft_templates, "w") as file:
        file.write(template)

    return jsonify(
        {
            "success": True,
            "filepath": path.join(
                current_user.normalize_name,
                config["id"],
                config["directory"],
                "templates",
                f"{file_name}.mst",
            ),
        }
    )


@basic_store.route("/api/app/<id>/template/<id_layer>", methods=["DELETE"])
def delete_layer_template(id, id_layer) -> ResponseReturnValue:
    config = _config_register().read_json(id)
    if not config:
        raise BadRequest("This config doesn't exists !")
    config = config[0]
    xml_path = path.join(current_app.config["EXPORT_CONF_FOLDER"], config["url"])
    parser = ET.fromstring(ET.tostring(read_xml_file_content(xml_path)))
    layer_node = parser.find(f".//layer[@id='{id_layer}']")
    if layer_node is None:
        raise BadRequest("This layer doesn't exists !")
    layer_template = layer_node.find(".//template")
    if layer_template is None:
        raise BadRequest("This layer template doesn't exists !")
    layer_template.set("url", "")
    write_file(parser, xml_path)

    draftspace = path.join(
        current_app.config["EXPORT_CONF_FOLDER"],
        current_user.normalize_name,
        config["id"],
    )
    draft_templates = path.join(
        draftspace, config["directory"], "templates", f"{id_layer}.mst"
    )
    if path.exists(draft_templates):
        remove(draft_templates)
    return jsonify({"success": True})


@basic_store.route("/api/app/<id>/exists", methods=["GET"])
def app_exists(id) -> ResponseReturnValue:
    config = _config_register().read_json(id)
    if not config:
        return jsonify({"success": True, "exists": False})
    return jsonify({"success": True, "exists": True})


@basic_store.route("/api/download/<id>", methods=["GET"])
def download(id) -> ResponseReturnValue:
    config = _config_register().read_json(id)
    if not config:
        raise BadRequest("This config doesn't exists !")
    config = config[0]
    draftspace = path.join(
        current_app.config["EXPORT_CONF_FOLDER"],
        config["publisher"],
        config["id"],
    )
    create_zip(draftspace, config["directory"])
    file_name = f"{config['directory']}.zip"
    url = path.join(
        current_app.config["CONF_PATH_FROM_MVIEWER"],
        config["publisher"],
        config["id"],
        "tmp",
        file_name,
    )
    return jsonify({"success": True, "url": url, "name": file_name})
