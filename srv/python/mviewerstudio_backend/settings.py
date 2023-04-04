import os


class Config:
    CONF_PATH_FROM_MVIEWER = os.getenv("CONF_PATH_FROM_MVIEWER", "apps/store")
    EXPORT_CONF_FOLDER = os.getenv("EXPORT_CONF_FOLDER", "./store")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    PROXY_WHITE_LIST = ["geobretagne.fr", "ows.region-bretagne.fr", "kartenn.region-bretagne.fr"]
    MVIEWERSTUDIO_PUBLISH_PATH =  os.getenv("MVIEWERSTUDIO_PUBLISH_PATH", "public")
    DEFAULT_ORG = os.getenv("DEFAULT_ORG", "public")
