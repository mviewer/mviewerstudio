from __future__ import annotations

import logging
import xml.etree.ElementTree as ET
from datetime import datetime
from os import makedirs, mkdir, path, walk
from shutil import rmtree, copyfileobj
from typing import cast
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from zipfile import BadZipFile, ZipFile

from flask import Blueprint, current_app, request
from flask.blueprints import BlueprintSetupState
from werkzeug.exceptions import BadRequest

from ..utils.register_utils import ConfigRegister

basic_store = Blueprint(
    "basic-store", __name__, static_folder="../static", static_url_path="/"
)

logger = logging.getLogger(__name__)


def _normalize_origin(origin: str | None) -> str:
    return (origin or "").strip().lower()


def _localhost_aliases() -> set[str]:
    return {"localhost", "127.0.0.1", "::1"}


def _origin_hostname(origin: str | None) -> str:
    normalized_origin = _normalize_origin(origin)
    if not normalized_origin:
        return ""

    if "://" not in normalized_origin:
        normalized_origin = f"http://{normalized_origin}"

    return (urlparse(normalized_origin).hostname or "").lower()


def _allowed_proxy_origins() -> set[str]:
    white_list = current_app.config["PROXY_WHITE_LIST"]
    allowed_origins = {_normalize_origin(origin) for origin in white_list if origin}
    if request.host:
        allowed_origins.add(_normalize_origin(request.host))
    forwarded_host = request.headers.get("X-Forwarded-Host")
    if forwarded_host:
        allowed_origins.update(
            _normalize_origin(host) for host in forwarded_host.split(",") if host.strip()
        )
    return allowed_origins


def _is_allowed_proxy_origin(url: str) -> bool:
    parsed_url = urlparse(url)
    target_origin = _normalize_origin(parsed_url.netloc)
    if not target_origin:
        return False

    allowed_origins = _allowed_proxy_origins()
    if target_origin in allowed_origins:
        return True

    target_hostname = _origin_hostname(target_origin)
    allowed_hostnames = {_origin_hostname(origin) for origin in allowed_origins}

    if target_hostname in allowed_hostnames:
        return True

    return (
        target_hostname in _localhost_aliases()
        and bool(allowed_hostnames.intersection(_localhost_aliases()))
    )


def _is_get_capabilities_url(url: str) -> bool:
    parsed_url = urlparse(url)
    query_params = {
        key.lower(): value for key, value in parse_qsl(parsed_url.query, keep_blank_values=True)
    }
    return query_params.get("request", "").lower() == "getcapabilities"


def _build_qgis_service_base_url(url: str) -> str:
    parsed_url = urlparse(url)
    filtered_query = [
        (key, value)
        for key, value in parse_qsl(parsed_url.query, keep_blank_values=True)
        if key.lower() not in {"service", "request", "version"}
    ]
    return urlunparse(
        (
            parsed_url.scheme,
            parsed_url.netloc,
            parsed_url.path,
            parsed_url.params,
            urlencode(filtered_query, doseq=True),
            parsed_url.fragment,
        )
    )


def _publish_path() -> str:
    return current_app.config["MVIEWERSTUDIO_PUBLISH_PATH"]


def _config_register() -> ConfigRegister:
    return cast(ConfigRegister, getattr(current_app, "register"))


def _xml_text_or_default(node: ET.Element | None, default: str = "") -> str:
    if node is None or node.text is None:
        return default
    return node.text


def _qgs_project_payload(qgs_dir: str, absolute_file: str) -> dict:
    relative_file = path.relpath(absolute_file, qgs_dir)
    filename = path.basename(absolute_file)
    project_name = path.splitext(filename)[0]

    return {
        "name": filename,
        "fileName": filename,
        "projectName": project_name,
        "path": relative_file,
        "lastModified": datetime.fromtimestamp(
            path.getmtime(absolute_file)
        ).isoformat(),
    }


def _extract_qgs_zip(
    uploaded_file, qgs_dir: str, filename: str
) -> tuple[str, list[dict], bool]:
    archive_name = path.splitext(filename)[0]
    destination_dir = path.join(qgs_dir, archive_name)
    overwritten = False
    try:
        with ZipFile(uploaded_file.stream) as archive:
            file_members = [
                member
                for member in archive.infolist()
                if member.filename and not member.filename.endswith("/")
            ]
            root_prefix = None

            top_level_parts = {
                member.filename.split("/", 1)[0]
                for member in file_members
                if "/" in member.filename.strip("/")
            }
            if len(top_level_parts) == 1 and len(file_members) > 0:
                root_prefix = f"{top_level_parts.pop()}/"

            normalized_members = []
            qgs_members = []
            for member in file_members:
                normalized_name = member.filename
                if root_prefix and normalized_name.startswith(root_prefix):
                    normalized_name = normalized_name[len(root_prefix) :]

                normalized_name = normalized_name.strip("/")
                if not normalized_name:
                    continue

                normalized_members.append((member, normalized_name))
                if normalized_name.lower().endswith(".qgs"):
                    qgs_members.append(normalized_name)

            if not qgs_members:
                raise BadRequest("ZIP archive does not contain any .qgs file")

            if len(qgs_members) == 1:
                project_name = path.splitext(path.basename(qgs_members[0]))[0]
                destination_dir = path.join(qgs_dir, project_name)
            else:
                destination_dir = path.join(qgs_dir, archive_name)

            overwritten = path.exists(destination_dir)
            if overwritten:
                rmtree(destination_dir, ignore_errors=True)
            mkdir(destination_dir)

            for member, normalized_name in normalized_members:
                destination = path.abspath(path.join(destination_dir, normalized_name))
                if path.commonpath(
                    [path.abspath(destination_dir), destination]
                ) != path.abspath(destination_dir):
                    raise BadRequest("ZIP archive contains invalid paths")

                parent_dir = path.dirname(destination)
                if parent_dir and not path.exists(parent_dir):
                    makedirs(parent_dir, exist_ok=True)

                with archive.open(member) as source, open(destination, "wb") as target:
                    copyfileobj(source, target)
    except BadZipFile:
        if path.exists(destination_dir):
            rmtree(destination_dir, ignore_errors=True)
        raise BadRequest("Invalid ZIP archive")
    except Exception:
        if path.exists(destination_dir):
            rmtree(destination_dir, ignore_errors=True)
        raise

    extracted_projects = []
    for root, _, files in walk(destination_dir):
        for extracted_file in files:
            if extracted_file.lower().endswith(".qgs"):
                extracted_projects.append(path.join(root, extracted_file))

    extracted_payloads = [
        _qgs_project_payload(qgs_dir, absolute_file) for absolute_file in extracted_projects
    ]
    extracted_payloads.sort(key=lambda item: item["path"].lower())
    return destination_dir, extracted_payloads, overwritten


def _store_qgs_file(uploaded_file, qgs_dir: str, filename: str) -> tuple[dict, bool]:
    project_name = path.splitext(filename)[0]
    destination_dir = path.join(qgs_dir, project_name)
    overwritten = path.exists(destination_dir)

    if overwritten:
        rmtree(destination_dir, ignore_errors=True)

    mkdir(destination_dir)
    destination = path.join(destination_dir, filename)

    try:
        uploaded_file.save(destination)
    except Exception:
        rmtree(destination_dir, ignore_errors=True)
        raise

    return _qgs_project_payload(qgs_dir, destination), overwritten


@basic_store.record_once
def basic_store_init(state: BlueprintSetupState):
    export_path = state.app.config["EXPORT_CONF_FOLDER"]
    styles_path = path.join(export_path, "styles")
    if not path.exists(export_path):
        mkdir(export_path)
    if not path.exists(styles_path):
        mkdir(styles_path)
