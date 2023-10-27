import os


class Config:
    CONF_PATH_FROM_MVIEWER = os.getenv("CONF_PATH_FROM_MVIEWER", "apps/store")
    CONF_PUBLISH_PATH_FROM_MVIEWER = os.getenv(
        "CONF_PUBLISH_PATH_FROM_MVIEWER", "apps/public"
    )
    EXPORT_CONF_FOLDER = os.getenv(
        "EXPORT_CONF_FOLDER", "/home/user/git/mviewer/apps/store"
    )
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    PROXY_WHITE_LIST = [
        "geobretagne.fr",
        "ows.region-bretagne.fr",
        "kartenn.region-bretagne.fr",
    ]
    MVIEWERSTUDIO_PUBLISH_PATH = os.getenv(
        "MVIEWERSTUDIO_PUBLISH_PATH", "/home/user/git/mviewer/apps/public"
    )
    DEFAULT_ORG = os.getenv("DEFAULT_ORG", "public")
    URL_PATH_PREFIX = os.getenv("MVIEWERSTUDIO_URL_PATH_PREFIX", "")

