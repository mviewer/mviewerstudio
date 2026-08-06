"""
Utilities used to join Grist rows with a geographic referential.

The module receives rows coming from the frontend, reads the selected join
field, requests only matching WFS features, then enriches rows with the matching
GeoJSON geometries, WKT and point coordinates.
"""

import json
import os
import requests
from urllib.parse import quote
from .commons import geojson_to_wkt

WFS_VALUE_CHUNK_SIZE = 300
GRIST_UPDATE_BATCH_SIZE = 200
GRIST_GEOMETRY_FIELD = "geometry"
GRIST_X_FIELD = "x"
GRIST_Y_FIELD = "y"
SUPPORTED_OUTPUT_FORMATS = ("geojson", "wkt")


def get_static_config_path():
    """
    Return the static frontend configuration path.

    :return: Static config path.
    :rtype: str
    """
    current_dir = os.path.dirname(__file__)

    return os.path.abspath(os.path.join(current_dir, "..", "static", "config.json"))


def get_static_grist_config():
    """
    Read Grist configuration from the static config file.

    :return: Grist configuration.
    :rtype: dict
    """
    with open(get_static_config_path(), encoding="utf-8") as config_file:
        config = json.load(config_file)

    app_config = config.get("app_conf", {})

    return app_config.get("grist", {})


def get_grist_api_url():
    """
    Return the configured Grist API URL.

    :return: Grist API URL.
    :rtype: str
    :raises ValueError: If the Grist API URL is missing.
    """
    grist_config = get_static_grist_config()
    api_url = grist_config.get("api_url") or grist_config.get("instance_url")

    if not api_url:
        raise ValueError("URL API Grist manquante.")

    return api_url.rstrip("/")


def get_configured_referential(label):
    """
    Return a configured referential by label.

    The backend does not trust layer URLs sent by the frontend. The selected
    label is used to retrieve the server-side configuration.

    :param str label: Selected referential label.
    :return: Referential configuration.
    :rtype: dict
    :raises ValueError: If no matching referential exists.
    """
    grist_config = get_static_grist_config()
    referentials = grist_config.get("grist_referentials", [])

    for referential in referentials:
        if referential.get("label") == label:
            return referential

    raise ValueError("Référentiel non autorisé.")


def get_grist_headers(api_key):
    """
    Return Grist request headers.

    :param str api_key: Grist API key.
    :return: Headers for Grist API requests.
    :rtype: dict
    """
    return {
        "Authorization": f"Bearer {api_key}",
    }


def get_grist_json_headers(api_key):
    """
    Return Grist request headers for JSON payloads.

    :param str api_key: Grist API key.
    :return: Headers for Grist API requests.
    :rtype: dict
    """
    headers = get_grist_headers(api_key)
    headers["Content-Type"] = "application/json"

    return headers


def get_grist_api_key(authorization_header):
    """
    Read the Grist API key from an Authorization header.

    :param str authorization_header: HTTP Authorization header.
    :return: Grist API key.
    :rtype: str
    :raises ValueError: If the header is missing or invalid.
    """
    if not authorization_header:
        raise ValueError("Clé API Grist manquante.")

    if not authorization_header.startswith("Bearer "):
        raise ValueError("Format de clé API Grist invalide.")

    api_key = authorization_header.replace("Bearer ", "", 1).strip()
    if not api_key:
        raise ValueError("Clé API Grist manquante.")

    return api_key


def get_grist_records(api_url, doc_id, table_id, api_key):
    """
    Fetch Grist records from the selected table.

    :param str api_url: Grist API URL.
    :param str doc_id: Grist document id.
    :param str table_id: Grist table id.
    :param str api_key: Grist API key.
    :return: Grist records.
    :rtype: list
    :raises requests.RequestException: If Grist returns an error.
    """
    records_url = (
        f"{api_url}/api/docs/{quote(str(doc_id))}"
        f"/tables/{quote(str(table_id))}/records"
    )
    response = requests.get(
        records_url,
        headers=get_grist_headers(api_key),
        timeout=30,
    )
    response.raise_for_status()

    return response.json().get("records", [])


def ensure_grist_columns(api_url, doc_id, table_id, column_ids, api_key):
    """
    Create the requested columns in Grist when they are missing.

    A 400 response is ignored because Grist returns an error when the column
    already exists.

    :param str api_url: Grist API URL.
    :param str doc_id: Grist document id.
    :param str table_id: Grist table id.
    :param list column_ids: Grist column identifiers to create.
    :param str api_key: Grist API key.
    :raises requests.RequestException: If Grist rejects column creation.
    """
    columns_url = (
        f"{api_url}/api/docs/{quote(str(doc_id))}"
        f"/tables/{quote(str(table_id))}/columns"
    )
    for column_id in column_ids:
        response = requests.post(
            columns_url,
            headers=get_grist_json_headers(api_key),
            json={
                "columns": [
                    {
                        "id": column_id,
                        "fields": {"label": column_id},
                    }
                ]
            },
            timeout=30,
        )

        if not response.ok and response.status_code != 400:
            response.raise_for_status()


def patch_grist_geometry_records(api_url, doc_id, table_id, records, api_key):
    """
    Update geometry fields for matched Grist records.

    :param str api_url: Grist API URL.
    :param str doc_id: Grist document id.
    :param str table_id: Grist table id.
    :param list records: Grist records to patch.
    :param str api_key: Grist API key.
    :raises requests.RequestException: If Grist returns an error.
    """
    records_url = (
        f"{api_url}/api/docs/{quote(str(doc_id))}"
        f"/tables/{quote(str(table_id))}/records"
    )

    for index in range(0, len(records), GRIST_UPDATE_BATCH_SIZE):
        chunk = records[index : index + GRIST_UPDATE_BATCH_SIZE]
        response = requests.patch(
            records_url,
            headers=get_grist_json_headers(api_key),
            json={"records": chunk},
            timeout=30,
        )
        response.raise_for_status()


def get_referential_type_name(referential):
    """
    Return the WFS layer name used for the join.

    :param dict referential: Referential configuration.
    :return: WFS layer name.
    :rtype: str
    """
    return referential.get("layer_name") or referential.get("name") or ""


def get_wfs_url(referential):
    """
    Return the WFS endpoint from a referential configuration.

    ``layer_url`` can point either to a GeoServer workspace URL, an ``/ows``
    endpoint or a ``/wfs`` endpoint.

    :param dict referential: Referential configuration.
    :return: WFS endpoint URL.
    :rtype: str
    """
    layer_url = referential.get("layer_url", "").rstrip("/")

    if layer_url.endswith("/ows") or layer_url.endswith("/wfs"):
        return layer_url

    return f"{layer_url}/ows"


def escape_cql_value(value):
    """
    Escape a value for a CQL IN filter.

    Single quotes are duplicated according to CQL string literal escaping.

    :param value: Value used in the CQL filter.
    :return: Escaped value.
    :rtype: str
    """
    return str(value).replace("'", "''")


def normalize_join_value(value):
    """
    Normalize source and referential values before joining.

    CSV and spreadsheet imports can add spaces, line breaks or transform
    administrative codes into numeric values.

    :param value: Raw join value.
    :return: Normalized join value.
    :rtype: str
    """
    if value is None:
        return ""

    normalized_value = str(value).strip()

    if normalized_value.endswith(".0"):
        normalized_value = normalized_value[:-2]

    return normalized_value


def build_cql_filter(join_field, values):
    """
    Build a CQL IN filter for the requested values.

    :param str join_field: Referential field used for the join.
    :param list values: Values found in source rows.
    :return: CQL filter.
    :rtype: str
    """
    quoted_values = [
        f"'{escape_cql_value(normalize_join_value(value))}'" for value in values
    ]

    return f"{join_field} IN ({','.join(quoted_values)})"


def build_wfs_payload(referential, values):
    """
    Build the WFS POST payload.

    :param dict referential: Referential configuration.
    :param list values: Values to request.
    :return: Form payload for a WFS GetFeature request.
    :rtype: dict
    """
    return {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": get_referential_type_name(referential),
        "outputFormat": "application/json",
        "CQL_FILTER": build_cql_filter(referential["join_field"], values),
    }


def chunk_values(values):
    """
    Split values to keep WFS filters reasonably small.

    :param list values: Values to split.
    :return: List of value chunks.
    :rtype: list
    """
    chunks = []

    for index in range(0, len(values), WFS_VALUE_CHUNK_SIZE):
        chunks.append(values[index : index + WFS_VALUE_CHUNK_SIZE])

    return chunks


def get_row_value(row, field):
    """
    Read a field value from a source row.

    :param dict row: Source row.
    :param str field: Field name.
    :return: Field value or an empty string.
    """
    if not row:
        return ""

    return row.get(field)


def get_matching_values(rows, matching_field):
    """
    Return distinct non-empty matching values from source rows.

    :param list rows: Source rows.
    :param str matching_field: Field selected in the source rows.
    :return: Unique values to request from WFS.
    :rtype: list
    """
    values = []

    for row in rows:
        value = get_row_value(row, matching_field)

        normalized_value = normalize_join_value(value)

        if normalized_value and normalized_value not in values:
            values.append(normalized_value)

    return values


def fetch_referential_features(referential, values):
    """
    Fetch only WFS features matching source values.

    The WFS request is sent with POST and a CQL filter. Values are split into
    chunks to avoid oversized filters.

    :param dict referential: Referential configuration.
    :param list values: Values used by the join.
    :return: GeoJSON features returned by WFS.
    :rtype: list
    :raises requests.RequestException: If the WFS request fails.
    """
    features = []
    wfs_url = get_wfs_url(referential)

    for chunk in chunk_values(values):
        response = requests.post(
            wfs_url,
            data=build_wfs_payload(referential, chunk),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30,
        )
        response.raise_for_status()
        geojson = response.json()
        features.extend(geojson.get("features", []))

    return features


def index_features_by_join_field(features, join_field):
    """
    Index WFS features by referential join field.

    :param list features: GeoJSON features.
    :param str join_field: Referential field used as index key.
    :return: Features indexed by join value.
    :rtype: dict
    """
    index = {}

    for feature in features:
        properties = feature.get("properties", {})
        value = properties.get(join_field)

        if value or value == 0:
            index[normalize_join_value(value)] = feature

    return index


def validate_join_payload(payload):
    """
    Validate and return the useful join payload values.

    :param dict payload: JSON payload received by the route.
    :return: Grist document id, table id, selected source field, output format and referential config.
    :rtype: tuple
    :raises ValueError: If a required payload value is missing.
    """
    if not payload:
        raise ValueError("Aucun payload fourni.")

    doc_id = payload.get("doc_id", "")
    table_id = payload.get("table_id", "")
    matching_field = payload.get("matching_field", "")
    referential_label = payload.get("referential_label", "")
    output_format = payload.get("output_format", "geojson")
    if not isinstance(output_format, str):
        raise ValueError("Format de sortie invalide.")
    output_format = output_format.lower()

    if not doc_id:
        raise ValueError("Document Grist manquant.")

    if not table_id:
        raise ValueError("Table Grist manquante.")

    if not matching_field:
        raise ValueError("Aucun champ de correspondance fourni.")

    if not referential_label:
        raise ValueError("Aucun référentiel fourni.")

    if output_format not in SUPPORTED_OUTPUT_FORMATS:
        raise ValueError("Format de sortie invalide.")

    referential = get_configured_referential(referential_label)
    if not referential.get("join_field"):
        raise ValueError("Champ de jointure du référentiel manquant.")

    if not get_referential_type_name(referential):
        raise ValueError("Couche WFS du référentiel manquante.")

    return doc_id, table_id, matching_field, output_format, referential


def get_rows_from_records(records):
    """
    Return row fields from Grist records.

    :param list records: Grist records.
    :return: Row fields.
    :rtype: list
    """
    rows = []

    for record in records:
        rows.append(record.get("fields", {}))

    return rows


def get_unmatched_row(row, output_format):
    """
    Return an unmatched row with common result fields.

    :param dict row: Source row.
    :return: Enriched unmatched row.
    :rtype: dict
    """
    return {
        **row,
        GRIST_GEOMETRY_FIELD: "",
        "refgeo_found": False,
    }


def get_geometry_field(output_format):
    """Return the Grist column id corresponding to an output format."""
    return GRIST_GEOMETRY_FIELD


def get_geometry_output(geometry, output_format):
    """Return a geometry serialized in the requested output format."""
    if output_format == "wkt":
        return geojson_to_wkt(geometry)

    return geometry


def get_grist_geometry_value(geometry_output, output_format):
    """Return the value to persist in Grist for a geometry output."""
    if output_format == "geojson":
        return json.dumps(geometry_output)

    return geometry_output


def is_point_geometry(geometry):
    """Return whether a GeoJSON geometry is a Point."""
    return geometry.get("type") == "Point"


def get_point_coordinates(geometry):
    """Return the x and y coordinates of a GeoJSON Point."""
    coordinates = geometry.get("coordinates", [])
    if len(coordinates) < 2:
        raise ValueError("Coordonnées du point invalides.")

    return coordinates[0], coordinates[1]


def join_rows_with_referential(payload, authorization_header):
    """
    Join source rows with a geographic referential through filtered WFS calls.

    :param dict payload: JSON payload received by the route.
    :param str authorization_header: HTTP Authorization header containing the Grist API key.
    :return: Join status, counters, rows enriched with geometries and unmatched rows.
    :rtype: dict
    :raises ValueError: If the payload is invalid.
    :raises requests.RequestException: If the WFS request fails.
    """
    api_key = get_grist_api_key(authorization_header)
    api_url = get_grist_api_url()
    doc_id, table_id, matching_field, output_format, referential = (
        validate_join_payload(payload)
    )
    records = get_grist_records(api_url, doc_id, table_id, api_key)
    rows = get_rows_from_records(records)
    matching_values = get_matching_values(rows, matching_field)

    if not matching_values:
        return {
            "status": "success",
            "total_rows": len(rows),
            "matched_rows": 0,
            "unmatched_rows": len(rows),
            "output_format": output_format,
            "rows": [],
            "unmatched": rows,
        }

    features = fetch_referential_features(referential, matching_values)
    features_by_join_field = index_features_by_join_field(
        features, referential["join_field"]
    )

    joined_rows = []
    unmatched = []
    records_to_patch = []

    for index, row in enumerate(rows):
        matching_value = get_row_value(row, matching_field)
        feature = features_by_join_field.get(normalize_join_value(matching_value))

        if not feature:
            enriched_row = get_unmatched_row(row, output_format)
            joined_rows.append(enriched_row)
            unmatched.append(row)
            continue

        geometry = feature.get("geometry")
        if not geometry:
            enriched_row = get_unmatched_row(row, output_format)
            joined_rows.append(enriched_row)
            unmatched.append(row)
            continue

        if is_point_geometry(geometry):
            x, y = get_point_coordinates(geometry)
            joined_rows.append(
                {**row, GRIST_X_FIELD: x, GRIST_Y_FIELD: y, "refgeo_found": True}
            )
            records_to_patch.append(
                {
                    "id": records[index]["id"],
                    "fields": {GRIST_X_FIELD: x, GRIST_Y_FIELD: y},
                }
            )
            continue

        geometry_field = get_geometry_field(output_format)
        geometry_output = get_geometry_output(geometry, output_format)
        joined_rows.append(
            {**row, geometry_field: geometry_output, "refgeo_found": True}
        )
        records_to_patch.append(
            {
                "id": records[index]["id"],
                "fields": {
                    geometry_field: get_grist_geometry_value(
                        geometry_output, output_format
                    )
                },
            }
        )

    if records_to_patch:
        column_ids = []
        for record in records_to_patch:
            for column_id in record["fields"]:
                if column_id not in column_ids:
                    column_ids.append(column_id)
        ensure_grist_columns(api_url, doc_id, table_id, column_ids, api_key)
        patch_grist_geometry_records(
            api_url, doc_id, table_id, records_to_patch, api_key
        )

    return {
        "status": "success",
        "total_rows": len(rows),
        "matched_rows": len(rows) - len(unmatched),
        "unmatched_rows": len(unmatched),
        "updated_rows": len(records_to_patch),
        "output_format": output_format,
        "rows": joined_rows,
        "unmatched": unmatched,
    }
