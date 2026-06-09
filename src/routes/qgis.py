from datetime import datetime
import logging
from pathlib import Path
from uuid import uuid4
from tempfile import TemporaryDirectory
from os import mkdir, path, walk
from shutil import rmtree
from urllib.parse import quote
import xml.etree.ElementTree as ET

import requests
from flask import current_app, jsonify, redirect, request
from flask.typing import ResponseReturnValue
from werkzeug.exceptions import HTTPException
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

logger = logging.getLogger(__name__)


def _configured_qgis_projects_url() -> str:
    """Return the configured QGIS projects base URL with a trailing slash."""
    internal_base_url = (
        current_app.config.get("QGIS_SERVER_INTERNAL_URL") or ""
    ).strip()
    if internal_base_url:
        return internal_base_url.rstrip("/") + "/"

    qgis_config = read_static_app_conf().get("qgis", {})
    base_url = (qgis_config.get("url") or "").strip()
    if not base_url:
        raise BadRequest("Missing qgis.url configuration in static config")
    return base_url.rstrip("/") + "/"


def _public_qgis_projects_url() -> str:
    """Return the public QGIS projects base URL exposed to the browser."""
    qgis_config = read_static_app_conf().get("qgis", {})
    base_url = (qgis_config.get("url") or "").strip()
    if not base_url:
        raise BadRequest("Missing qgis.url configuration in static config")
    return base_url.rstrip("/") + "/"


def _fetchable_qgis_capabilities_url(capabilities_url: str) -> str:
    """Return a backend-reachable capabilities URL while preserving the public URL."""
    internal_base_url = (
        current_app.config.get("QGIS_SERVER_INTERNAL_URL") or ""
    ).strip()
    if not internal_base_url:
        return capabilities_url

    public_base_url = _public_qgis_projects_url()
    normalized_public_base_url = public_base_url.rstrip("/") + "/"
    normalized_internal_base_url = internal_base_url.rstrip("/") + "/"

    if capabilities_url.startswith(normalized_public_base_url):
        suffix = capabilities_url[len(normalized_public_base_url) :]
        return f"{normalized_internal_base_url}{suffix}"

    return capabilities_url


def _is_configured_qgis_url(url: str) -> bool:
    """Return ``True`` when the URL targets the configured QGIS projects base."""
    configured_urls = {_public_qgis_projects_url()}
    internal_base_url = (
        current_app.config.get("QGIS_SERVER_INTERNAL_URL") or ""
    ).strip()
    if internal_base_url:
        configured_urls.add(internal_base_url.rstrip("/") + "/")
    return any(url.startswith(configured_url) for configured_url in configured_urls)


def _project_capabilities_url(project_name: str) -> str:
    """Build the QGIS Server WMS GetCapabilities URL for a stored project."""
    if not project_name:
        raise BadRequest("Missing QGIS project name")
    return (
        f"{_public_qgis_projects_url()}{project_name}"
        "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities"
    )


def _project_capabilities_url_from_relative_path(
    relative_path: str | None, project_name: str
) -> str:
    """Build the public GetCapabilities URL for a stored QGIS project."""
    if not project_name:
        raise BadRequest("Missing QGIS project name")

    projects_path = (current_app.config.get("QGIS_SERVER_PROJECTS_PATH") or "").strip()
    if not projects_path or not relative_path:
        return _project_capabilities_url(project_name)

    base_url = _public_qgis_projects_url()
    map_path = f"{projects_path.rstrip('/')}/{relative_path.lstrip('/')}"
    separator = "&" if "?" in base_url else "?"
    return (
        f"{base_url}{separator}MAP={quote(map_path, safe='/')}"
        "&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities"
    )


def _stored_qgis_project_payload(project_name: str) -> dict:
    """Return the stored QGIS project payload for a project name."""
    project_dir = _stored_qgis_project_directory(project_name)
    qgs_dir = current_app.config.get("QGS_FOLDER")
    if not qgs_dir:
        raise BadRequest("Missing QGS folder configuration")

    qgs_files = []
    for root, _, files in walk(project_dir):
        for filename in files:
            if filename.lower().endswith(".qgs"):
                qgs_files.append(path.join(root, filename))

    if not qgs_files:
        raise BadRequest("QGIS project does not exist")

    qgs_files.sort()
    return _qgs_project_payload(qgs_dir, qgs_files[0])


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

    fetch_url = _fetchable_qgis_capabilities_url(capabilities_url)
    try:
        response = requests.get(fetch_url, timeout=30)
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
        xml_content = create_mviewer_xml_text_from_wms_capabilities(
            capabilities_path,
            service_base_url,
        )
    return _apply_root_layer_bbox_to_mviewer_xml(xml_content, response.content)


def _xml_local_name(tag: str) -> str:
    """Return the local XML name without its optional namespace."""
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


def _find_direct_child(element: ET.Element, child_name: str) -> ET.Element | None:
    """Return the first direct child matching the provided local name."""
    for child in list(element):
        if _xml_local_name(child.tag) == child_name:
            return child
    return None


def _find_direct_children(element: ET.Element, child_name: str) -> list[ET.Element]:
    """Return all direct children matching the provided local name."""
    return [
        child for child in list(element) if _xml_local_name(child.tag) == child_name
    ]


def _format_bbox_value(value: float) -> str:
    """Serialize a bbox numeric value without trailing zeros when possible."""
    return f"{value:.12g}"


def _parse_bbox_attributes(
    bbox_node: ET.Element,
) -> tuple[float, float, float, float] | None:
    """Return bbox coordinates from a WMS ``BoundingBox``-like XML node."""
    try:
        return (
            float(bbox_node.attrib["minx"]),
            float(bbox_node.attrib["miny"]),
            float(bbox_node.attrib["maxx"]),
            float(bbox_node.attrib["maxy"]),
        )
    except (KeyError, TypeError, ValueError):
        return None


def _root_layer_bbox_from_capabilities(
    capabilities_content: bytes, target_projection: str | None
) -> str | None:
    """Return the root-layer bbox matching the target projection when available."""
    try:
        capabilities_root = ET.fromstring(capabilities_content)
    except ET.ParseError:
        return None

    capability_node = _find_direct_child(capabilities_root, "Capability")
    root_layer_node = (
        _find_direct_child(capability_node, "Layer")
        if capability_node is not None
        else None
    )
    if root_layer_node is None:
        return None

    bounding_boxes = _find_direct_children(root_layer_node, "BoundingBox")
    normalized_projection = (target_projection or "").upper()

    matching_bbox_node = None
    if normalized_projection:
        matching_bbox_node = next(
            (
                bbox_node
                for bbox_node in bounding_boxes
                if (
                    bbox_node.attrib.get("CRS") or bbox_node.attrib.get("SRS") or ""
                ).upper()
                == normalized_projection
            ),
            None,
        )

    if matching_bbox_node is None and len(bounding_boxes) == 1:
        matching_bbox_node = bounding_boxes[0]

    bbox_values = (
        _parse_bbox_attributes(matching_bbox_node)
        if matching_bbox_node is not None
        else None
    )
    if bbox_values is None and normalized_projection in ("", "EPSG:4326", "CRS:84"):
        latlon_bbox_node = _find_direct_child(root_layer_node, "LatLonBoundingBox")
        bbox_values = (
            _parse_bbox_attributes(latlon_bbox_node)
            if latlon_bbox_node is not None
            else None
        )

        if bbox_values is None:
            geographic_bbox_node = _find_direct_child(
                root_layer_node, "EX_GeographicBoundingBox"
            )
            if geographic_bbox_node is not None:
                west_node = _find_direct_child(
                    geographic_bbox_node, "westBoundLongitude"
                )
                south_node = _find_direct_child(
                    geographic_bbox_node, "southBoundLatitude"
                )
                east_node = _find_direct_child(
                    geographic_bbox_node, "eastBoundLongitude"
                )
                north_node = _find_direct_child(
                    geographic_bbox_node, "northBoundLatitude"
                )
                try:
                    bbox_values = (
                        float(west_node.text),
                        float(south_node.text),
                        float(east_node.text),
                        float(north_node.text),
                    )
                except (AttributeError, TypeError, ValueError):
                    bbox_values = None

    if bbox_values is None:
        return None

    return ",".join(_format_bbox_value(value) for value in bbox_values)


def _apply_root_layer_bbox_to_mviewer_xml(
    xml_content: str, capabilities_content: bytes
) -> str:
    """Inject the root-layer bbox into generated mviewer map options."""
    xml_root = ET.fromstring(xml_content)
    mapoptions_node = xml_root.find("mapoptions")
    if mapoptions_node is None:
        return xml_content

    projection = mapoptions_node.get("projection")
    bbox = _root_layer_bbox_from_capabilities(capabilities_content, projection)
    if not bbox:
        return xml_content

    minx, miny, maxx, maxy = [float(value) for value in bbox.split(",")]
    center = ",".join(
        _format_bbox_value(value) for value in ((minx + maxx) / 2, (miny + maxy) / 2)
    )

    mapoptions_node.set("extent", bbox)
    mapoptions_node.set("center", center)
    return ET.tostring(xml_root, encoding="unicode")


def _store_uploaded_qgis_project() -> dict:
    """Persist an uploaded QGIS project or archive and return its project payload."""
    qgs_dir = current_app.config.get("QGS_FOLDER")
    if not qgs_dir:
        raise BadRequest("Missing QGS folder configuration")

    logger.info(
        "QGIS upload request received: content_type=%s files=%s form=%s",
        request.content_type,
        list(request.files.keys()),
        list(request.form.keys()),
    )
    uploaded_file = request.files.get("file")
    if not uploaded_file or not uploaded_file.filename:
        logger.info("QGIS upload rejected: missing file field in multipart payload")
        raise BadRequest("Missing QGS file")

    filename = secure_filename(uploaded_file.filename)
    logger.info("QGIS upload received file=%s target_dir=%s", filename, qgs_dir)
    lower_filename = filename.lower()
    if not lower_filename.endswith((".qgs", ".zip", ".qgz")):
        raise BadRequest(
            "Only .qgs files, .zip archives or .qgz archives are supported"
        )

    if not path.exists(qgs_dir):
        mkdir(qgs_dir)

    if lower_filename.endswith((".zip", ".qgz")):
        _, extracted_projects, overwritten = _extract_qgs_zip(
            uploaded_file, qgs_dir, filename
        )
        project_payload = extracted_projects[0].copy()
        project_payload["projects"] = extracted_projects
        project_payload["archiveName"] = filename
        project_payload["overwritten"] = overwritten
        return project_payload

    project_payload, overwritten = _store_qgs_file(uploaded_file, qgs_dir, filename)
    project_payload["projects"] = [project_payload.copy()]
    project_payload["overwritten"] = overwritten
    return project_payload


def _ensure_config_metadata(xml_content: str, project_name: str) -> str:
    """Inject the minimum Studio metadata required to persist generated XML."""
    xml_root = ET.fromstring(xml_content)
    app_conf = read_static_app_conf()

    if not xml_root.get("mviewerversion") and app_conf.get("mviewer_version"):
        xml_root.set("mviewerversion", str(app_conf["mviewer_version"]))
    if not xml_root.get("mviewerstudioversion") and app_conf.get(
        "mviewerstudio_version"
    ):
        xml_root.set("mviewerstudioversion", str(app_conf["mviewerstudio_version"]))

    application_node = xml_root.find("application")
    app_title = (
        application_node.get("title") if application_node is not None else ""
    ) or (project_name or "Projet QGIS")
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
    return (
        f"{mviewer_instance}/{relative_path}"
        if mviewer_instance
        else f"/{relative_path}"
    )


def _studio_open_config_url(config_url: str) -> str:
    """Return the Studio URL that opens a config through the ``config`` parameter."""
    app_prefix = current_app.config.get("MVIEWERSTUDIO_URL_PATH_PREFIX", "").strip("/")
    base_url = request.url_root.rstrip("/")
    if app_prefix:
        base_url = f"{base_url}/{app_prefix}"
    return f"{base_url}/index.html#?config={quote(config_url, safe='/:?&=%')}"


def _stored_qgis_project_directory(project_name: str) -> str:
    """Return the absolute directory of a stored QGIS project."""
    qgs_dir = current_app.config.get("QGS_FOLDER")
    if not qgs_dir:
        raise BadRequest("Missing QGS folder configuration")
    if not project_name:
        raise BadRequest("Missing QGIS project name")

    normalized_project_name = secure_filename(project_name)
    project_dir = path.abspath(path.join(qgs_dir, normalized_project_name))
    qgs_dir_absolute = path.abspath(qgs_dir)
    if path.commonpath([qgs_dir_absolute, project_dir]) != qgs_dir_absolute:
        raise BadRequest("Invalid QGIS project name")
    return project_dir


def _qgis_open_error_response(
    error: Exception, project_name: str | None = None
) -> ResponseReturnValue:
    """Build a JSON error response for QGIS project open/create routes."""
    if isinstance(error, HTTPException):
        status_code = error.code or 500
        reason = error.description
        error_name = error.name
    else:
        status_code = 500
        reason = str(error) or "Unexpected error while creating the QGIS configuration"
        error_name = "Internal Server Error"

    payload = {
        "success": False,
        "name": error_name,
        "reason": reason,
    }
    if project_name:
        payload["projectName"] = project_name

    return jsonify(payload), status_code


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
                qgs_files.append(
                    _qgs_project_payload(qgs_dir, path.join(root, filename))
                )

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

    logger.info(
        "QGIS import request received: content_type=%s files=%s form=%s",
        request.content_type,
        list(request.files.keys()),
        list(request.form.keys()),
    )
    uploaded_file = request.files.get("file")
    if not uploaded_file or not uploaded_file.filename:
        logger.info("QGIS import rejected: missing file field in multipart payload")
        raise BadRequest("Missing QGS file")

    filename = secure_filename(uploaded_file.filename)
    logger.info("QGIS import received file=%s target_dir=%s", filename, qgs_dir)
    lower_filename = filename.lower()
    if not lower_filename.endswith((".qgs", ".zip", ".qgz")):
        raise BadRequest(
            "Only .qgs files, .zip archives or .qgz archives are supported"
        )

    if not path.exists(qgs_dir):
        mkdir(qgs_dir)

    if lower_filename.endswith((".zip", ".qgz")):
        _, extracted_projects, overwritten = _extract_qgs_zip(
            uploaded_file, qgs_dir, filename
        )
        project_payload = extracted_projects[0]
    else:
        project_payload, overwritten = _store_qgs_file(uploaded_file, qgs_dir, filename)

    capabilities_url = _project_capabilities_url(project_payload["projectName"])
    logger.info(
        "QGIS import resolved project=%s capabilities_url=%s overwritten=%s",
        project_payload["projectName"],
        capabilities_url,
        overwritten,
    )
    xml_content = _mviewer_xml_from_capabilities_url(capabilities_url)
    response = current_app.response_class(xml_content, mimetype="application/xml")
    response.headers["X-Qgis-Project-Name"] = project_payload["projectName"]
    response.headers["X-Qgis-Capabilities-Url"] = capabilities_url
    response.headers["X-Qgis-Project-Overwritten"] = str(overwritten).lower()
    return response


@basic_store.route("/api/app/qgis/projects/open", methods=["POST"])
def create_and_open_qgis_project_config() -> ResponseReturnValue:
    """Create a Studio config from an uploaded QGIS project and expose open URLs."""
    project_name = None
    try:
        project_payload = _store_uploaded_qgis_project()
        project_name = project_payload["projectName"]
        capabilities_url = _project_capabilities_url(project_name)
        config_data, _ = _create_config_from_qgis_capabilities(
            capabilities_url, project_name
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
    except Exception as error:
        return _qgis_open_error_response(error, project_name)


@basic_store.route("/api/app/qgis/projects/<project_name>/open", methods=["POST"])
def create_and_open_stored_qgis_project_config(
    project_name: str,
) -> ResponseReturnValue:
    """Create a Studio config from an existing stored QGIS project."""
    try:
        _stored_qgis_project_directory(project_name)
        capabilities_url = _project_capabilities_url(project_name)
        config_data, _ = _create_config_from_qgis_capabilities(
            capabilities_url, project_name
        )
        config_url = _absolute_config_url(config_data["url"])
        studio_url = _studio_open_config_url(config_url)

        if request.args.get("redirect", "").lower() in {"1", "true", "yes"}:
            return redirect(studio_url)

        return jsonify(
            {
                "success": True,
                "projectName": project_name,
                "capabilitiesUrl": capabilities_url,
                "filepath": config_data["url"],
                "configUrl": config_url,
                "studioUrl": studio_url,
                "config": config_data,
            }
        )
    except Exception as error:
        return _qgis_open_error_response(error, project_name)


@basic_store.route("/api/app/qgis/projects/<project_name>", methods=["DELETE"])
def delete_stored_qgis_project(project_name: str) -> ResponseReturnValue:
    """Delete a stored QGIS project directory."""
    project_dir = _stored_qgis_project_directory(project_name)
    if not path.exists(project_dir):
        raise BadRequest("QGIS project does not exist")

    rmtree(project_dir, ignore_errors=True)
    return jsonify({"success": True, "projectName": project_name})
