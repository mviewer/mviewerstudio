import os


class Config:
    CONF_PATH_FROM_MVIEWER = os.getenv("CONF_PATH_FROM_MVIEWER", "apps/store")
    CONF_PUBLISH_PATH_FROM_MVIEWER = os.getenv(
        "CONF_PUBLISH_PATH_FROM_MVIEWER", "apps/public"
    )
    EXPORT_CONF_FOLDER = os.getenv(
        "EXPORT_CONF_FOLDER", "/home/gaetan/projects/mviewer/mviewer/apps/store"
    )
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    PROXY_WHITE_LIST = os.getenv(
        "MVIEWERSTUDIO_PROXY_WHITE_LIST",
        "geobretagne.fr,ows.region-bretagne.fr,kartenn.region-bretagne.fr",
    ).split(",")
    MVIEWERSTUDIO_PUBLISH_PATH = os.getenv(
        "MVIEWERSTUDIO_PUBLISH_PATH",
        "/home/gaetan/projects/mviewer/mviewer/apps/public",
    )
    DEFAULT_ORG = os.getenv("DEFAULT_ORG", "public")
    MVIEWERSTUDIO_URL_PATH_PREFIX = os.getenv("MVIEWERSTUDIO_URL_PATH_PREFIX", "")
    QGIS_SERVER_INTERNAL_URL = os.getenv("QGIS_SERVER_INTERNAL_URL", "")
    QGIS_SERVER_PROJECTS_PATH = os.getenv("QGIS_SERVER_PROJECTS_PATH", "")

    QGS_FOLDER = os.getenv(
        "QGS_FOLDER", "/home/gaetan/projects/qgis/compo-jm/volumes/qgis-srv"
    )
