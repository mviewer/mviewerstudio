from flask import current_app
from urllib.parse import urlparse
import requests
import xml.etree.ElementTree as ET

from werkzeug.exceptions import BadRequest, Forbidden

from .login_utils import current_user


def validate_xml_creator(xml_text: str) -> str:
    """
    Parse XML text and deny access when dc:creator exists and does not match
    the current authenticated user.

    :param xml_text: raw XML payload
    :returns: original XML payload when access is allowed
    :raises BadRequest: when the payload is not valid XML
    :raises Forbidden: when dc:creator does not match the current user
    """
    xml_root = get_xml_root(xml_text)
    creator = xml_root.find(".//metadata/{*}RDF/{*}Description//{*}creator")
    creator_name = creator.text.strip() if creator is not None and creator.text else ""

    if creator_name and creator_name != current_user.username:
        raise Forbidden("Not allowed to load this configuration !")

    return xml_text


def get_xml_root(xml_text: str):
    """
    Parse an XML string and return its root node.

    :param xml_text: raw XML payload
    :raises BadRequest: when the payload is not valid XML
    """
    try:
        return ET.fromstring(xml_text)
    except ET.ParseError:
        raise BadRequest("XML seems not correct !")


def get_xml_identifier(xml_text: str) -> str:
    """
    Extract the DCAT identifier from a raw XML payload.

    :param xml_text: raw XML payload
    :returns: configuration identifier found in metadata
    :raises BadRequest: when the identifier is missing
    """
    xml_root = get_xml_root(xml_text)
    identifier = xml_root.find(".//metadata/{*}RDF/{*}Description//{*}identifier")
    if identifier is None or not identifier.text:
        raise BadRequest("Missing XML identifier !")
    return identifier.text


def get_existing_config_or_404(id: str) -> dict:
    """
    Read a configuration from the register and return its metadata.

    :param id: configuration identifier
    :returns: register entry for the requested configuration
    :raises BadRequest: when the configuration does not exist
    """
    config = current_app.register.read_json(id)
    if not config:
        raise BadRequest("This config doesn't exists !")
    return config[0]


def authorize_config_mutation(config: dict) -> dict:
    """
    Ensure the current user can mutate the given configuration.

    Access is granted only when both the publisher and creator match the
    authenticated user context.

    :param config: configuration metadata from the register
    :returns: the same configuration metadata when authorized
    :raises Forbidden: when the current user is not allowed to modify it
    """
    if config["publisher"] != current_user.normalize_name:
        raise Forbidden("Not allowed to modify this configuration !")
    if config["creator"] != current_user.username:
        raise Forbidden("Not allowed to modify this configuration !")
    return config


def fetch_remote_xml(url: str, timeout: int = 10) -> str:
    if not url:
        raise BadRequest("Missing url parameter !")

    parsed_url = urlparse(url)
    if parsed_url.scheme not in ["http", "https"]:
        raise BadRequest("URL must use http or https !")

    try:
        response = requests.get(
            url,
            timeout=timeout,
            headers={
                "User-Agent": "Kartenn-MVS/1.0",
                "Accept": "application/xml,text/xml,*/*",
            },
            allow_redirects=True,
        )
        current_app.logger.warning(
            "Remote XML fetch: url=%s status=%s final_url=%s content_type=%s",
            url,
            response.status_code,
            response.url,
            response.headers.get("Content-Type"),
        )
        response.raise_for_status()

    except requests.RequestException as exc:
        current_app.logger.exception("Could not retrieve XML from %s", url)
        raise BadRequest(f"Could not retrieve XML: {exc}")

    return response.text
