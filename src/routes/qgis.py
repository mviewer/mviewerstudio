from datetime import datetime
from pathlib import Path
from uuid import uuid4
from tempfile import TemporaryDirectory
from os import mkdir, path, walk
from urllib.parse import quote
import xml.etree.ElementTree as ET

import requests
from flask import current_app, jsonify, redirect, request
from flask.typing import ResponseReturnValue
from werkzeug.exceptions import BadRequest, MethodNotAllowed
from werkzeug.utils import secure_filename

from ..utils.config_utils import Config, normalize_url_part, read_static_app_conf
from ..utils.login_utils import current_user
from .shared import (
    _build_qgis_service_base_url,
    _config_register,
    _extract_qgs_zip,
    _is_allowed_proxy_origin,
    _is_get_capabilities_url,
    _qgs_project_payload,
    _store_qgs_file,
    basic_store,
)

from qgisxmviewer import create_mviewer_xml_text_from_wms_capabilities

RDF_NAMESPACE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
DC_NAMESPACE = "http://purl.org/dc/elements/1.1/"

ET.register_namespace("rdf", RDF_NAMESPACE)
ET.register_namespace("dc", DC_NAMESPACE)


def _configured_qgis_projects_url() -> str:
    """Return the configured QGIS projects base URL with a trailing slash."""
    qgis_config = read_static_app_conf().get("qgis", {})
    base_url = (qgis_config.get("url") or "").strip()
    if not base_url:
        raise BadRequest("Missing qgis.url configuration in static config")
    return base_url.rstrip("/") + "/"


def _is_configured_qgis_url(url: str) -> bool:
    """Return ``True`` when the URL targets the configured QGIS projects base."""
    configured_url = _configured_qgis_projects_url()
    return url.startswith(configured_url)


def _project_capabilities_url(project_name: str) -> str:
    """Build the QGIS Server WMS GetCapabilities URL for a stored project."""
    if not project_name:
        raise BadRequest("Missing QGIS project name")
    return (
        f"{_configured_qgis_projects_url()}{project_name}"
        "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities"
    )


def _mviewer_xml_from_capabilities_url(capabilities_url: str) -> str:
    """Fetch a WMS GetCapabilities document and convert it to mviewer XML."""
    if not capabilities_url:
        raise BadRequest("Missing GetCapabilities URL")
    if not _is_get_capabilities_url(capabilities_url):
        raise BadRequest("URL must be a WMS GetCapabilities request")
    if not _is_allowed_proxy_origin(capabilities_url) and not _is_configured_qgis_url(
        capabilities_url
    ):
        raise MethodNotAllowed("Not allowed !")

    try:
        response = requests.get(capabilities_url, timeout=30)
    except requests.RequestException as exc:
        raise BadRequest(
            f"Unable to fetch GetCapabilities document from {capabilities_url}: {exc}"
        ) from exc

    if not response.ok:
        response_excerpt = response.text[:300].strip() if response.text else ""
        error_details = (
            f"Unable to fetch GetCapabilities document from {capabilities_url} "
            f"(HTTP {response.status_code})"
        )
        if response_excerpt:
            error_details = f"{error_details}: {response_excerpt}"
        raise BadRequest(error_details)

    service_base_url = _build_qgis_service_base_url(capabilities_url)
    with TemporaryDirectory(prefix="mviewerstudio-qgis-") as temp_dir:
        capabilities_path = Path(temp_dir) / "GetCapabilities.xml"
        capabilities_path.write_bytes(response.content)
        return create_mviewer_xml_text_from_wms_capabilities(
            capabilities_path,
            service_base_url,
        )


def _store_uploaded_qgis_project() -> dict:
    """Persist an uploaded QGIS project or archive and return its project payload."""
    qgs_dir = current_app.config.get("QGS_FOLDER")
    if not qgs_dir:
        raise BadRequest("Missing QGS folder configuration")

    uploaded_file = request.files.get("file")
    if not uploaded_file or not uploaded_file.filename:
        raise BadRequest("Missing QGS file")

    filename = secure_filename(uploaded_file.filename)
    lower_filename = filename.lower()
    if not lower_filename.endswith((".qgs", ".zip", ".qgz")):
        raise BadRequest("Only .qgs files, .zip archives or .qgz archives are supported")

    if not path.exists(qgs_dir):
        mkdir(qgs_dir)

    if lower_filename.endswith((".zip", ".qgz")):
        _, extracted_projects = _extract_qgs_zip(uploaded_file, qgs_dir, filename)
        project_payload = extracted_projects[0].copy()
        project_payload["projects"] = extracted_projects
        project_payload["archiveName"] = filename
        return project_payload

    project_payload = _store_qgs_file(uploaded_file, qgs_dir, filename)
    project_payload["projects"] = [project_payload.copy()]
    return project_payload


def _ensure_config_metadata(xml_content: str, project_name: str) -> str:
    """Inject the minimum Studio metadata required to persist generated XML."""
    xml_root = ET.fromstring(xml_content)
    app_conf = read_static_app_conf()

    if not xml_root.get("mviewerversion") and app_conf.get("mviewer_version"):
        xml_root.set("mviewerversion", str(app_conf["mviewer_version"]))
    if not xml_root.get("mviewerstudioversion") and app_conf.get("mviewerstudio_version"):
        xml_root.set("mviewerstudioversion", str(app_conf["mviewerstudio_version"]))

    application_node = xml_root.find("application")
    app_title = (application_node.get("title") if application_node is not None else "") or (
        project_name or "Projet QGIS"
    )
    creator = current_user.username if current_user else "anonymous"
    publisher = (
        current_user.normalize_name
        if current_user
        else current_app.config.get("DEFAULT_ORG", "public")
    )

    metadata_node = xml_root.find("metadata")
    if metadata_node is None:
        metadata_node = ET.Element("metadata")
        xml_root.insert(0, metadata_node)

    rdf_root = metadata_node.find(f"{{{RDF_NAMESPACE}}}RDF")
    if rdf_root is None:
        rdf_root = ET.SubElement(metadata_node, f"{{{RDF_NAMESPACE}}}RDF")

    rdf_description = rdf_root.find(f"{{{RDF_NAMESPACE}}}Description")
    if rdf_description is None:
        rdf_description = ET.SubElement(
            rdf_root,
            f"{{{RDF_NAMESPACE}}}Description",
            {"{http://www.w3.org/1999/02/22-rdf-syntax-ns#}about": ""},
        )

    metadata_defaults = {
        "title": app_title,
        "creator": creator,
        "identifier": uuid4().hex[:12],
        "keywords": "qgis,import",
        "publisher": publisher,
        "description": f"Configuration générée depuis QGIS Server pour le projet {app_title}",
        "date": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "relation": "",
    }

    for key, default_value in metadata_defaults.items():
        node = rdf_description.find(f"{{{DC_NAMESPACE}}}{key}")
        if node is None:
            node = ET.SubElement(rdf_description, f"{{{DC_NAMESPACE}}}{key}")
        if node.text is None or not node.text.strip():
            node.text = default_value

    return ET.tostring(xml_root, encoding="unicode")


def _create_config_from_qgis_capabilities(
    capabilities_url: str, project_name: str
) -> tuple[dict, str]:
    """Create and register a Studio config from a QGIS Server capabilities URL."""
    xml_content = _mviewer_xml_from_capabilities_url(capabilities_url)
    xml_content = _ensure_config_metadata(xml_content, project_name)

    config = Config(xml=xml_content, app=current_app)
    if not config or not config.xml:
        raise BadRequest("Unable to create config from QGIS capabilities")

    config.git.commit_changes("Creation from QGIS Server capabilities")
    config_data = config.as_data()
    current_config = _config_register().read_json(config_data.id)
    if not current_config:
        _config_register().add(config_data.as_dict())
    else:
        _config_register().update(config_data.as_dict())

    return config_data.as_dict(), xml_content


def _absolute_config_url(config_path: str) -> str:
    """Return the public absolute URL of a stored Studio XML config."""
    app_conf = read_static_app_conf()
    mviewer_instance = (app_conf.get("mviewer_instance") or "").rstrip("/")
    conf_path = normalize_url_part(app_conf.get("conf_path_from_mviewer", ""))
    relative_path = "/".join(
        part for part in [conf_path, normalize_url_part(config_path)] if part
    )
    return f"{mviewer_instance}/{relative_path}" if mviewer_instance else f"/{relative_path}"


def _studio_open_config_url(config_url: str) -> str:
    """Return the Studio URL that opens a config through the ``config`` parameter."""
    app_prefix = current_app.config.get("MVIEWERSTUDIO_URL_PATH_PREFIX", "").strip("/")
    base_url = request.url_root.rstrip("/")
    if app_prefix:
        base_url = f"{base_url}/{app_prefix}"
    return f"{base_url}/index.html#?config={quote(config_url, safe='/:?&=%')}"


@basic_store.route("/api/app/qgis/projects", methods=["GET", "POST"])
def list_stored_qgs_configs() -> ResponseReturnValue:
    """List stored QGIS projects or upload a new project/archive."""
    qgs_dir = current_app.config.get("QGS_FOLDER")

    if request.method == "POST":
        response_payload = _store_uploaded_qgis_project()
        response_payload["success"] = True
        return jsonify(response_payload)

    if not qgs_dir or not path.exists(qgs_dir):
        return jsonify([])

    qgs_files = []
    for root, _, files in walk(qgs_dir):
        for filename in files:
            if filename.lower().endswith(".qgs"):
                qgs_files.append(_qgs_project_payload(qgs_dir, path.join(root, filename)))

    qgs_files.sort(key=lambda item: item["path"].lower())
    return jsonify(qgs_files)


@basic_store.route("/api/app/qgis/capabilities", methods=["POST"])
def import_qgis_capabilities() -> ResponseReturnValue:
    """Convert a QGIS Server GetCapabilities URL to mviewer XML."""
    payload = request.get_json(silent=True) or {}
    capabilities_url = payload.get("url", "").strip()
    xml_content = _mviewer_xml_from_capabilities_url(capabilities_url)
    return current_app.response_class(xml_content, mimetype="application/xml")


@basic_store.route("/api/app/qgis/project", methods=["POST"])
def import_qgis_project() -> ResponseReturnValue:
    """Upload a QGIS project, resolve its GetCapabilities URL, and return XML."""
    qgs_dir = current_app.config.get("QGS_FOLDER")
    if not qgs_dir:
        raise BadRequest("Missing QGS folder configuration")

    uploaded_file = request.files.get("file")
    if not uploaded_file or not uploaded_file.filename:
        raise BadRequest("Missing QGS file")

    filename = secure_filename(uploaded_file.filename)
    lower_filename = filename.lower()
    if not lower_filename.endswith((".qgs", ".zip", ".qgz")):
        raise BadRequest("Only .qgs files, .zip archives or .qgz archives are supported")

    if not path.exists(qgs_dir):
        mkdir(qgs_dir)

    if lower_filename.endswith((".zip", ".qgz")):
        _, extracted_projects = _extract_qgs_zip(uploaded_file, qgs_dir, filename)
        project_payload = extracted_projects[0]
    else:
        project_payload = _store_qgs_file(uploaded_file, qgs_dir, filename)

    capabilities_url = _project_capabilities_url(project_payload["projectName"])
    xml_content = _mviewer_xml_from_capabilities_url(capabilities_url)
    response = current_app.response_class(xml_content, mimetype="application/xml")
    response.headers["X-Qgis-Project-Name"] = project_payload["projectName"]
    response.headers["X-Qgis-Capabilities-Url"] = capabilities_url
    return response


@basic_store.route("/api/app/qgis/projects/open", methods=["POST"])
def create_and_open_qgis_project_config() -> ResponseReturnValue:
    """Create a Studio config from an uploaded QGIS project and expose open URLs."""
    project_payload = _store_uploaded_qgis_project()
    capabilities_url = _project_capabilities_url(project_payload["projectName"])
    config_data, _ = _create_config_from_qgis_capabilities(
        capabilities_url, project_payload["projectName"]
    )
    config_url = _absolute_config_url(config_data["url"])
    studio_url = _studio_open_config_url(config_url)

    if request.args.get("redirect", "").lower() in {"1", "true", "yes"}:
        return redirect(studio_url)

    return jsonify(
        {
            "success": True,
            "project": project_payload,
            "capabilitiesUrl": capabilities_url,
            "filepath": config_data["url"],
            "configUrl": config_url,
            "studioUrl": studio_url,
            "config": config_data,
        }
    )
