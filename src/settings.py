import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
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
    MVIEWERSTUDIO_AUTH_MODE = os.getenv("MVIEWERSTUDIO_AUTH_MODE", "auto").lower()
    MVIEWERSTUDIO_AUTH_TYPE = os.getenv(
        "MVIEWERSTUDIO_AUTH_TYPE", "georchestra"
    ).lower()
    MVIEWERSTUDIO_AUTHLIB_ISSUER = os.getenv("MVIEWERSTUDIO_AUTHLIB_ISSUER", "")
    MVIEWERSTUDIO_AUTHLIB_METADATA_URL = os.getenv(
        "MVIEWERSTUDIO_AUTHLIB_METADATA_URL", ""
    )
    MVIEWERSTUDIO_AUTHLIB_CLIENT_ID = os.getenv(
        "MVIEWERSTUDIO_AUTHLIB_CLIENT_ID", ""
    )
    MVIEWERSTUDIO_AUTHLIB_CLIENT_SECRET = os.getenv(
        "MVIEWERSTUDIO_AUTHLIB_CLIENT_SECRET", ""
    )
    MVIEWERSTUDIO_AUTHLIB_SCOPE = os.getenv(
        "MVIEWERSTUDIO_AUTHLIB_SCOPE", "openid profile email"
    )
    MVIEWERSTUDIO_AUTHLIB_GROUPS_CLAIM = os.getenv(
        "MVIEWERSTUDIO_AUTHLIB_GROUPS_CLAIM", ""
    )
    MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING = os.getenv(
        "MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING", "{}"
    )
    MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS = os.getenv(
        "MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS", ""
    )
    MVIEWERSTUDIO_AUTHLIB_ANONYMOUS_REDIRECT_URL = os.getenv(
        "MVIEWERSTUDIO_AUTHLIB_ANONYMOUS_REDIRECT_URL", ""
    )
    OIDC_END_SESSION_ENDPOINT = os.getenv("OIDC_END_SESSION_ENDPOINT", "")
    OIDC_POST_LOGOUT_REDIRECT_URI = os.getenv("OIDC_POST_LOGOUT_REDIRECT_URI", "")
    OAUTH2_PROXY_OIDC_ISSUER_URL = os.getenv("OAUTH2_PROXY_OIDC_ISSUER_URL", "")
    OAUTH2_PROXY_CLIENT_ID = os.getenv("OAUTH2_PROXY_CLIENT_ID", "")
    SESSION_TYPE = os.getenv("SESSION_TYPE", "filesystem")
    SESSION_FILE_DIR = os.getenv("SESSION_FILE_DIR", "/tmp/mviewerstudio-flask-session")
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
