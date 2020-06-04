from flask import Blueprint, jsonify, Response, request, current_app, redirect
from .login_utils import current_user
import hashlib
import os.path
from glob import glob
import lxml.etree as ET
from pathlib import Path
from flask.blueprints import BlueprintSetupState

basic_store = Blueprint(
    "basic-store", __name__, static_folder="static", static_url_path="/"
)


@basic_store.record_once
def basic_store_init(state: BlueprintSetupState):
    p = Path(state.app.config["EXPORT_CONF_FOLDER"])
    if not p.exists():
        p.mkdir()
    if not (p / 'styles').exists():
        (p / "styles").mkdir()


@basic_store.route("/")
def default_doc():
    return redirect("index.html")


@basic_store.route("/srv/user_info", methods=["GET"])
def user() -> Response:
    return jsonify(current_user.as_dict())


@basic_store.route("/srv/store", methods=["POST"])
def store_mviewer_config() -> Response:
    raw_xml = request.data.decode("utf-8")
    xml_with_replaced_user = raw_xml.replace("anonymous", current_user.username)
    filehash = hashlib.md5()
    filehash.update(xml_with_replaced_user.encode("utf-8"))
    filename = f"{filehash.hexdigest()}.xml"
    absolute_path = os.path.join(current_app.config["EXPORT_CONF_FOLDER"], filename)
    with open(absolute_path, "w") as f:
        f.write(xml_with_replaced_user)
    return jsonify({"success": True, "filepath": filename})


@basic_store.route("/srv/list", methods=["GET"])
def list_stored_mviewer_config() -> Response:
    """
    Return all mviewer config created by the current user
    """
    filepath = os.path.join(current_app.config["EXPORT_CONF_FOLDER"], "*.xml")
    files = glob(filepath)
    files.sort(key=os.path.getmtime, reverse=True)
    metadatas = list()
    for f in files:
        xml = ET.parse(f)
        description = xml.find(".//metadata/{*}RDF/{*}Description")
        if description.find(".//{*}creator").text == current_user.username:
            url = f.replace(
                current_app.config["EXPORT_CONF_FOLDER"],
                current_app.config["CONF_PATH_FROM_MVIEWER"],
            )
            subject = description.find("{*}subject")
            if subject is not None:
                subject = subject.text
            print(subject)
            metadata = {
                "url": url,
                "creator": description.find("{*}creator").text,
                "date": description.find("{*}date").text,
                "title": description.find("{*}title").text,
                "subjects": subject,
            }
            metadatas.append(metadata)
    return jsonify(metadatas)


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


@basic_store.route('/srv/store/style', methods=['POST'])
def store_style() -> Response:
    """
    This endpoint stores SLD style locally. it does not verify the content.
    """
    raw_style = request.data.decode("utf-8")
    filehash = hashlib.sha256()
    filehash.update(raw_style.encode("utf-8"))
    filename = f"{filehash.hexdigest()}.sld"
    absolute_path = os.path.join(current_app.config["EXPORT_CONF_FOLDER"], 'styles', filename)
    with open(absolute_path, "w") as f:
        f.write(raw_style)
    return jsonify({"success": True, "filepath": os.path.join(current_app.config['CONF_PATH_FROM_MVIEWER'], 'styles', filename)})
