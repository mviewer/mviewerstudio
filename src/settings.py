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
    PROXY_USER_AGENT = os.getenv("MVIEWERSTUDIO_PROXY_USER_AGENT", "mviewerstudio")

    # Requests reads these environment variables directly (including NO_PROXY).
    # These values expose the environment configuration; changing only Flask's
    # config does not change the proxy used by Requests.
    HTTP_PROXY = os.getenv("http_proxy", os.getenv("HTTP_PROXY"))
    HTTPS_PROXY = os.getenv("https_proxy", os.getenv("HTTPS_PROXY"))
    NO_PROXY = os.getenv("no_proxy", os.getenv("NO_PROXY"))
    GRIST_API_URL = os.getenv("GRIST_API_URL", "https://grist.numerique.gouv.fr")
    GRIST_PROXY_TIMEOUT = float(os.getenv("GRIST_PROXY_TIMEOUT", "20"))
    GRIST_CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("GRIST_CORS_ORIGINS", "").split(",")
        if origin.strip()
    ]

    PROXY_WHITE_LIST = os.getenv(
        "MVIEWERSTUDIO_PROXY_WHITE_LIST",
        "geobretagne.fr,ows.region-bretagne.fr,kartenn.region-bretagne.fr,qgisserver.hautsdefrance.fr",
    ).split(",")
    MVIEWERSTUDIO_PUBLISH_PATH = os.getenv(
        "MVIEWERSTUDIO_PUBLISH_PATH",
        "/home/gaetan/projects/mviewer/mviewer/apps/public",
    )
    DEFAULT_ORG = os.getenv("DEFAULT_ORG", "public")
    MVIEWERSTUDIO_URL_PATH_PREFIX = os.getenv("MVIEWERSTUDIO_URL_PATH_PREFIX", "")
