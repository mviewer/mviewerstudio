from os import walk, remove, path, mkdir, sep, makedirs
from shutil import make_archive, copyfile, copytree, rmtree, move
import re, unicodedata


def geojson_to_wkt(geometry):
    """
    Convert a GeoJSON geometry dictionary to its WKT representation.

    :param dict geometry: GeoJSON geometry.
    :return: WKT geometry.
    :rtype: str
    :raises ValueError: If the geometry type is unsupported or invalid.
    """
    if not geometry:
        raise ValueError("Géométrie GeoJSON manquante.")

    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates")

    if geometry_type == "GeometryCollection":
        geometries = geometry.get("geometries", [])
        return "GEOMETRYCOLLECTION ({})".format(
            ", ".join(geojson_to_wkt(item) for item in geometries)
        )

    wkt_types = {
        "Point": "POINT",
        "LineString": "LINESTRING",
        "Polygon": "POLYGON",
        "MultiPoint": "MULTIPOINT",
        "MultiLineString": "MULTILINESTRING",
        "MultiPolygon": "MULTIPOLYGON",
    }
    if geometry_type not in wkt_types or coordinates is None:
        raise ValueError("Géométrie GeoJSON invalide.")

    wkt_coordinates = _geojson_coordinates_to_wkt(coordinates)
    if geometry_type == "Point":
        wkt_coordinates = "({})".format(wkt_coordinates)

    return "{} {}".format(wkt_types[geometry_type], wkt_coordinates)


def _geojson_coordinates_to_wkt(coordinates):
    """Return recursively parenthesized GeoJSON coordinates for WKT."""
    if not isinstance(coordinates, (list, tuple)):
        raise ValueError("Coordonnées GeoJSON invalides.")

    if coordinates and isinstance(coordinates[0], (int, float)):
        return " ".join(str(value) for value in coordinates)

    return "(" + ", ".join(
        _geojson_coordinates_to_wkt(item) for item in coordinates
    ) + ")"

"""
Clean preview workspace to avoid spaces with many old files
"""


def clean_preview(app, app_dir):
    """
    Will remove each XML files in config preview directory
    """
    if not app_dir:
        return

    preview_dir = path.join(app.config["EXPORT_CONF_FOLDER"], app_dir, "preview")
    for root, dirs, files in walk(preview_dir):
        if not files:
            break
        for f in files:
            remove(path.join(preview_dir, f))


def replace_special_chars(string):
    # Suppression des accents
    phrase = "".join(
        c
        for c in unicodedata.normalize("NFD", string)
        if unicodedata.category(c) != "Mn"
    )
    # Remplacement des espaces et caractères spéciaux par des underscores
    phrase = re.sub(r"[^a-zA-Z0-9_]", "_", phrase)
    return phrase.lower()

    # Remplacer les accents
    string = re.sub(r"[àáâãäå]", "a", string)
    string = re.sub(r"[ç]", "c", string)
    string = re.sub(r"[èéêë]", "e", string)
    string = re.sub(r"[ìíîï]", "i", string)
    string = re.sub(r"[ñ]", "n", string)
    string = re.sub(r"[òóôõö]", "o", string)
    string = re.sub(r"[ùúûü]", "u", string)
    string = re.sub(r"[ýÿ]", "y", string)

    # Remplacer les caractères spéciaux et les espaces par un tiret bas (_)
    string = re.sub(r"[^a-zA-Z0-9_]", "_", string)

    return string.lower()


"""
Prepare preview space
"""


def init_preview(app, id):
    """
    Will create preview directory inside given config workspace if necessary.
    """
    config_path = path.join(app.config["EXPORT_CONF_FOLDER"], id)
    if not app or not id or not path.exists(config_path):
        return
    preview_path = path.join(config_path, "preview")
    if not path.exists(preview_path):
        mkdir(path.join(config_path, "preview"))


"""
Create zip
"""


def create_zip(dir, name):
    tmp_dir = path.join(dir, "tmp")
    zip_dir = path.join(tmp_dir, name)
    zip_space = path.join(zip_dir, name)
    zip_file = path.join(tmp_dir, "%s.zip" % name)

    if path.exists(tmp_dir):
        rmtree(tmp_dir)
    makedirs(zip_dir)

    copyfile(path.join(dir, "%s.xml" % name), path.join(zip_dir, "%s.xml" % name))
    copytree(path.join(dir, name), zip_space)
    custom_make_archive(zip_dir, zip_file)

    return zip_file


"""
Ease make_archive use
"""


def custom_make_archive(source, destination):
    base_name, ext = path.splitext(destination)
    archive_format = ext.lstrip(".")
    archive_from = path.dirname(source)
    archive_to = path.basename(source.rstrip(sep))

    make_archive(base_name, archive_format, archive_from, archive_to)
