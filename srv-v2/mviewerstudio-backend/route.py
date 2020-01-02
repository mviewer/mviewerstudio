from flask import Blueprint, jsonify, Response, request
from .login_utils import User, login_required, current_user
import hashlib
import os.path
from glob import glob
from defusedxml.ElementTree import parse
from pathlib import Path

basic_store = Blueprint("basic-store", __name__)


@basic_store.route("/user_infos", methods=["GET"])
@login_required
def user() -> Response:
    return jsonify(current_user.as_dict())


@basic_store.route("/store", methods=["POST"])
@login_required
def store_mviewer_config() -> Response:
    raw_xml = request.data.decode("utf-8")
    xml_with_replaced_user = raw_xml.replace("anonymous", current_user.username)
    filehash = hashlib.md5()
    filehash.update(xml_with_replaced_user.encode("utf-8"))
    filename = f"{filehash.hexdigest()}.xml"
    absolute_path = os.path.join(basic_store.config.EXPORT_CONF_FOLDER, filename)
    with open(absolute_path, "w") as f:
        f.write(xml_with_replaced_user)
    return jsonify({"success": True, "filepath": filename})


@basic_store.route("/list", methods=["GET"])
@login_required
def list_stored_mviewer_config() -> Response:
    """
    Return all mviewer config created by the current user
    """
    filepath = os.path.join(basic_store.config.EXPORT_CONF_FOLDER, "*.xml")
    files = glob(filepath)
    files.sort(key=os.path.getmtime, reverse=True)
    metadatas = list()
    for f in files:
        xml = parse(f)
        description = xml.find("//metadata/RDF/Description")
        if description.find("//creator").text == current_user.username:
            url = f.replace(
                basic_store.config["EXPORT_CONF_FOLDER"],
                basic_store.config["CONF_PATH_FROM_MVIEWER"],
            )
            metadata = {
                "url": url,
                "creator": description.find("creator").text,
                "date": description.find("date").text,
                "title": description.find("title").text,
                "subjects": description.find("subject").text,
            }
            metadatas.append(metadata)
    return jsonify(metadatas)


@basic_store.route("/delete")
@login_required
def delete_mviewer_config() -> Response:
    """
    Delete all the mviewer config of the user logged
    """
    nb_file_deleted = 0
    filepath = os.path.join(basic_store.config.export_conf_folder, "*.xml")
    files = glob(filepath)
    for f in files:
        xml = parse(f)
        description = xml.find("//metadata/RDF/Description")
        if description.find("//creator").text == current_user.username:
            Path(f).unlink()
            nb_file_deleted += 1
    return jsonify({"deleted_files": nb_file_deleted})
