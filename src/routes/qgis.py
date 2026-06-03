from pathlib import Path
from tempfile import TemporaryDirectory
from os import mkdir, path, walk

import requests
from flask import current_app, jsonify, request
from flask.typing import ResponseReturnValue
from werkzeug.exceptions import BadRequest, MethodNotAllowed
from werkzeug.utils import secure_filename

from ..utils.config_utils import read_static_app_conf
from .shared import (
    _build_qgis_service_base_url,
    _extract_qgs_zip,
    _is_allowed_proxy_origin,
    _is_get_capabilities_url,
    _qgs_project_payload,
    _store_qgs_file,
    basic_store,
)

from qgisxmviewer import create_mviewer_xml_text_from_wms_capabilities


def _configured_qgis_projects_url() -> str:
    qgis_config = read_static_app_conf().get("qgis", {})
    base_url = (qgis_config.get("url") or "").strip()
    if not base_url:
        raise BadRequest("Missing qgis.url configuration in static config")
    return base_url.rstrip("/") + "/"


def _is_configured_qgis_url(url: str) -> bool:
    configured_url = _configured_qgis_projects_url()
    return url.startswith(configured_url)


def _project_capabilities_url(project_name: str) -> str:
    if not project_name:
        raise BadRequest("Missing QGIS project name")
    return (
        f"{_configured_qgis_projects_url()}{project_name}"
        "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities"
    )


def _mviewer_xml_from_capabilities_url(capabilities_url: str) -> str:
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


@basic_store.route("/api/app/qgis/projects", methods=["GET", "POST"])
def list_stored_qgs_configs() -> ResponseReturnValue:
    qgs_dir = current_app.config.get("QGS_FOLDER")

    if request.method == "POST":
        if not qgs_dir:
            raise BadRequest("Missing QGS folder configuration")

        uploaded_file = request.files.get("file")
        if not uploaded_file or not uploaded_file.filename:
            raise BadRequest("Missing QGS file")

        filename = secure_filename(uploaded_file.filename)
        lower_filename = filename.lower()
        if not lower_filename.endswith((".qgs", ".zip", ".qgz")):
            raise BadRequest(
                "Only .qgs files, .zip archives or .qgz archives are supported"
            )

        if not path.exists(qgs_dir):
            mkdir(qgs_dir)

        if lower_filename.endswith((".zip", ".qgz")):
            _, extracted_projects = _extract_qgs_zip(uploaded_file, qgs_dir, filename)
            response_payload = extracted_projects[0].copy()
            response_payload["success"] = True
            response_payload["projects"] = extracted_projects
            response_payload["archiveName"] = filename
            return jsonify(response_payload)

        response_payload = _store_qgs_file(uploaded_file, qgs_dir, filename)
        response_payload["success"] = True
        response_payload["projects"] = [response_payload.copy()]
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
    payload = request.get_json(silent=True) or {}
    capabilities_url = payload.get("url", "").strip()
    xml_content = _mviewer_xml_from_capabilities_url(capabilities_url)
    return current_app.response_class(xml_content, mimetype="application/xml")


@basic_store.route("/api/app/qgis/project", methods=["POST"])
def import_qgis_project() -> ResponseReturnValue:
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
