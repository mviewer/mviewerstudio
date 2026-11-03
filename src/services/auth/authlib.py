"""OIDC client flow backed by Authlib for self-managed authentication mode.

This module is intentionally provider-agnostic and relies on standard OIDC
discovery metadata so it can work with Keycloak, GeoNode/Django OIDC, or any
other compliant provider.
"""

import ast
import json
from urllib.parse import urlencode
from urllib.request import urlopen

from flask import current_app, redirect, request, session, url_for
from werkzeug.exceptions import InternalServerError

from ...auth_mode import is_authlib_configured
from ...extensions import oauth


AUTHLIB_CLIENT_NAME = "mviewerstudio"
AUTHLIB_SESSION_CLAIMS_KEY = "mviewerstudio.auth.claims"
AUTHLIB_SESSION_TOKEN_KEY = "mviewerstudio.auth.token"


def _configured_groups_claim_names() -> list[str]:
    """Return configured claim aliases that may contain groups/roles."""
    configured = current_app.config.get("MVIEWERSTUDIO_AUTHLIB_GROUPS_CLAIM", "")
    if not isinstance(configured, str):
        return []
    return [name.strip() for name in configured.split(",") if name.strip()]


def allowed_authlib_groups() -> list[str]:
    """Return the configured allow-list of Authlib groups/roles."""
    configured = current_app.config.get("MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS", "")
    if not isinstance(configured, str):
        return []
    normalized = configured.replace(";", ",")
    return [group.strip() for group in normalized.split(",") if group.strip()]


def authlib_metadata_url() -> str:
    """Return the explicit metadata URL or derive it from the issuer URL."""
    metadata_url = current_app.config.get("MVIEWERSTUDIO_AUTHLIB_METADATA_URL", "").strip()
    if metadata_url:
        return metadata_url
    issuer = current_app.config.get("MVIEWERSTUDIO_AUTHLIB_ISSUER", "").rstrip("/")
    if not issuer:
        return ""
    return f"{issuer}/.well-known/openid-configuration"


def init_authlib_client(app) -> None:
    """Register the Authlib OAuth client when Authlib mode is configured."""
    if not is_authlib_configured():
        return
    if oauth.create_client(AUTHLIB_CLIENT_NAME) is not None:
        return

    oauth.register(
        name=AUTHLIB_CLIENT_NAME,
        client_id=app.config["MVIEWERSTUDIO_AUTHLIB_CLIENT_ID"],
        client_secret=app.config["MVIEWERSTUDIO_AUTHLIB_CLIENT_SECRET"],
        server_metadata_url=authlib_metadata_url(),
        client_kwargs={"scope": app.config["MVIEWERSTUDIO_AUTHLIB_SCOPE"]},
    )
    try:
        current_app.logger.info(
            "Authlib client '%s' registered (client_id=%s)",
            AUTHLIB_CLIENT_NAME,
            app.config.get("MVIEWERSTUDIO_AUTHLIB_CLIENT_ID", "(missing)"),
        )
    except Exception:
        pass


def authlib_client():
    """Return the configured Authlib client or fail with a server error."""
    client = oauth.create_client(AUTHLIB_CLIENT_NAME)
    if client is None:
        try:
            current_app.logger.error("Authlib client '%s' is not configured.", AUTHLIB_CLIENT_NAME)
        except Exception:
            pass
        raise InternalServerError("Authlib client is not configured.")
    return client


def _load_authlib_server_metadata(client) -> dict[str, object]:
    """Return OIDC metadata, fetching discovery data when this worker has none."""
    metadata = getattr(client, "server_metadata", {}) or {}
    if metadata.get("end_session_endpoint"):
        return metadata

    load_server_metadata = getattr(client, "load_server_metadata", None)
    if callable(load_server_metadata):
        try:
            loaded_metadata = load_server_metadata()
            if isinstance(loaded_metadata, dict) and loaded_metadata:
                metadata = loaded_metadata
                if metadata.get("end_session_endpoint"):
                    return metadata
        except Exception as e:
            current_app.logger.warning("Could not load Authlib server metadata: %s", e)

    metadata_url = authlib_metadata_url()
    if not metadata_url:
        return metadata if isinstance(metadata, dict) else {}

    try:
        with urlopen(metadata_url, timeout=5) as response:
            fetched_metadata = json.load(response)
        if isinstance(fetched_metadata, dict):
            try:
                client.server_metadata = fetched_metadata
            except Exception:
                pass
            return fetched_metadata
    except Exception as e:
        current_app.logger.warning(
            "Could not fetch Authlib discovery metadata from %s: %s",
            metadata_url,
            e,
        )

    return metadata if isinstance(metadata, dict) else {}


def app_root_path() -> str:
    """Return the studio root path, including the optional URL prefix."""
    app_prefix = current_app.config.get("MVIEWERSTUDIO_URL_PATH_PREFIX", "").strip("/")
    if not app_prefix:
        return "/"
    return f"/{app_prefix}/"


def _coerce_claims(payload: object) -> dict[str, object]:
    """Normalize an arbitrary payload into a mapping of claims."""
    return payload if isinstance(payload, dict) else {}


def _first_claim(claims: dict[str, object], *names: str) -> object | None:
    """Return the first non-empty claim value found among aliases."""
    for name in names:
        value = claims.get(name)
        if value is None:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        return value
    return None


def _string_claim(claims: dict[str, object], *names: str) -> str:
    """Return the first matching claim coerced to a stripped string."""
    value = _first_claim(claims, *names)
    if value is None:
        return ""
    return str(value).strip()


def _roles_from_value(value: object) -> list[str]:
    """Normalize role/group claims from list or string values."""
    if isinstance(value, list):
        return [str(role).strip() for role in value if str(role).strip()]
    if isinstance(value, str):
        normalized_value = value.replace(",", ";").replace(" ", ";")
        return [role for role in normalized_value.split(";") if role]
    return []


def _roles_from_claims(claims: dict[str, object]) -> list[str]:
    """Extract application roles from common OIDC claim conventions."""
    for claim_name in _configured_groups_claim_names():
        configured_roles = _roles_from_value(claims.get(claim_name))
        if configured_roles:
            return configured_roles

    roles = _roles_from_value(claims.get("roles"))
    if roles:
        return roles

    realm_access = claims.get("realm_access")
    if isinstance(realm_access, dict):
        realm_roles = _roles_from_value(realm_access.get("roles"))
        if realm_roles:
            return realm_roles

    for key in ("groups", "group_list_all", "group_list"):
        group_roles = _roles_from_value(claims.get(key))
        if group_roles:
            return group_roles
    return []


def _claim_path_parts(expression: str) -> list[str | int]:
    """Parse dictionary keys and list indexes without executing expressions."""
    def parts(node):
        if isinstance(node, ast.Name):
            return [node.id]
        if isinstance(node, ast.Attribute):
            return parts(node.value) + [node.attr]
        if isinstance(node, ast.Subscript) and isinstance(node.slice, ast.Constant):
            key = node.slice.value
            if type(key) in (str, int) and (not isinstance(key, int) or key >= 0):
                return parts(node.value) + [key]
        raise ValueError("Claim paths only support keys and non-negative list indexes")

    try:
        return parts(ast.parse(expression, mode="eval").body)
    except SyntaxError as exc:
        raise ValueError("Invalid claim path") from exc


def _apply_claims_mapping(raw_claims: dict, normalized: dict) -> None:
    """Override normalized fields using configured paths into provider claims."""
    configured = current_app.config.get("MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING", "{}")
    try:
        mapping = json.loads(configured or "{}")
    except (TypeError, ValueError) as exc:
        raise ValueError("MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING must be a JSON object") from exc
    if not isinstance(mapping, dict):
        raise ValueError("MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING must be a JSON object")
    for field, expression in mapping.items():
        if field not in normalized or not isinstance(expression, str):
            raise ValueError(f"Invalid claim mapping for {field!r}")
        value = raw_claims
        for key in _claim_path_parts(expression):
            if isinstance(value, dict) and isinstance(key, str):
                value = value.get(key)
            elif isinstance(value, list) and isinstance(key, int) and key < len(value):
                value = value[key]
            else:
                value = None
                break
        normalized[field] = _roles_from_value(value) if field == "roles" else value


def normalize_claims(claims: object) -> dict[str, object]:
    """Map provider-specific claim names to the application's user shape."""
    raw_claims = _coerce_claims(claims)
    full_name = _string_claim(raw_claims, "name", "full_name")
    given_name = _string_claim(raw_claims, "given_name", "first_name")
    family_name = _string_claim(raw_claims, "family_name", "last_name")
    if full_name and (not given_name or not family_name):
        name_parts = full_name.split(" ", 1)
        if not given_name and name_parts:
            given_name = name_parts[0]
        if not family_name and len(name_parts) > 1:
            family_name = name_parts[1]

    organization = _first_claim(
        raw_claims,
        "organization",
        "organisation",
        "org",
        "company",
        "legal_name",
    )
    username = _string_claim(raw_claims, "username", "user_name", "login")
    preferred_username = _string_claim(raw_claims, "preferred_username")
    if username and (not preferred_username or preferred_username.isdigit()):
        preferred = username
    else:
        preferred = (
            preferred_username
            or username
            or _string_claim(raw_claims, "nickname", "email", "sub")
        )
    normalized = {
        "preferred_username": preferred or None,
        "email": _first_claim(raw_claims, "email"),
        "name": full_name or None,
        "given_name": given_name or None,
        "family_name": family_name or None,
        "organization": organization,
        "roles": _roles_from_claims(raw_claims),
        "sub": _first_claim(raw_claims, "sub"),
    }
    _apply_claims_mapping(raw_claims, normalized)
    try:
        current_app.logger.info("Authlib normalized claims: %s", normalized)
    except Exception:
        pass
    return normalized


def authlib_user_is_allowed(claims: dict[str, object] | None = None) -> bool:
    """Check whether the authenticated Authlib user passes group-based access rules."""
    allowed_groups = allowed_authlib_groups()
    if not allowed_groups:
        return True

    normalized_claims = claims if isinstance(claims, dict) else get_authlib_session_claims()
    user_groups = normalized_claims.get("roles", [])
    if not isinstance(user_groups, list):
        user_groups = []

    allowed = any(group in allowed_groups for group in user_groups)
    try:
        current_app.logger.info(
            "Authlib group access check: allowed=%s, allowed_groups=%s, user_groups=%s",
            allowed,
            allowed_groups,
            user_groups,
        )
    except Exception:
        pass
    return allowed


def store_authlib_session(token: dict[str, object], claims: dict[str, object]) -> None:
    """Persist token and normalized user claims in the Flask session."""
    try:
        current_app.logger.info(
            "Storing auth session: token_keys=%s, claim_keys=%s",
            list(token.keys()) if isinstance(token, dict) else str(type(token)),
            list(claims.keys()) if isinstance(claims, dict) else str(type(claims)),
        )
    except Exception:
        pass
    session[AUTHLIB_SESSION_TOKEN_KEY] = token
    session[AUTHLIB_SESSION_CLAIMS_KEY] = claims
    session.modified = True


def get_authlib_session_claims() -> dict[str, object]:
    """Read normalized user claims from the current Flask session."""
    claims = session.get(AUTHLIB_SESSION_CLAIMS_KEY, {})
    return claims if isinstance(claims, dict) else {}


def clear_authlib_session() -> None:
    """Remove Authlib-managed authentication state from the Flask session."""
    session.pop(AUTHLIB_SESSION_TOKEN_KEY, None)
    session.pop(AUTHLIB_SESSION_CLAIMS_KEY, None)
    session.modified = True


def start_authlib_login():
    """Start the OIDC authorization code flow and remember the return URL."""
    # Prefer explicit 'next', then referrer, otherwise send to the studio index page
    app_index = app_root_path().rstrip("/") + "/index.html"
    next_url = request.args.get("next") or request.referrer or app_index
    session["mviewerstudio.auth.next_url"] = next_url
    callback_url = url_for("auth-routes.authlib_callback", _external=True)
    client = authlib_client()
    metadata = getattr(client, "server_metadata", {}) or {}
    try:
        current_app.logger.info(
            "Start auth login: next=%s, callback=%s, configured_scope=%s, provider_scopes_supported=%s",
            next_url,
            callback_url,
            current_app.config.get("MVIEWERSTUDIO_AUTHLIB_SCOPE"),
            metadata.get("scopes_supported"),
        )
    except Exception:
        pass
    return client.authorize_redirect(callback_url)


def _user_claims_from_token(token: dict[str, object]) -> dict[str, object]:
    """Extract claims from the token payload or fetch them from ``userinfo``."""
    token_claims = _coerce_claims(token.get("userinfo"))
    if token_claims:
        current_app.logger.info("Using token userinfo claims: %s", token_claims)
        return token_claims
    client = authlib_client()
    metadata = getattr(client, "server_metadata", {}) or {}
    if metadata.get("userinfo_endpoint"):
        try:
            current_app.logger.info(
                "Userinfo endpoint present: %s", metadata.get("userinfo_endpoint")
            )
            response = client.userinfo(token=token)
            if hasattr(response, "json"):
                claims = _coerce_claims(response.json())
            else:
                claims = _coerce_claims(response)
            try:
                current_app.logger.info(
                    "Userinfo fetched: claims=%s, keys=%s",
                    claims,
                    list(claims.keys()),
                )
            except Exception:
                pass
            return claims
        except Exception as e:
            current_app.logger.error("Error fetching userinfo: %s", e)
            return {}
    return {}


def complete_authlib_login():
    """Finalize the OIDC callback, store claims in session, then redirect back."""
    callback_error = request.args.get("error")
    if callback_error:
        current_app.logger.error(
            "OIDC callback error: error=%s, description=%s, scope=%s",
            callback_error,
            request.args.get("error_description", ""),
            current_app.config.get("MVIEWERSTUDIO_AUTHLIB_SCOPE"),
        )
    client = authlib_client()
    metadata = getattr(client, "server_metadata", {}) or {}
    token = client.authorize_access_token()
    try:
        current_app.logger.info(
            "Token exchange completed: token_keys=%s, token_scope=%s, configured_scope=%s, provider_scopes_supported=%s",
            list(token.keys()) if isinstance(token, dict) else str(type(token)),
            token.get("scope") if isinstance(token, dict) else None,
            current_app.config.get("MVIEWERSTUDIO_AUTHLIB_SCOPE"),
            metadata.get("scopes_supported"),
        )
    except Exception:
        pass
    raw_claims = _user_claims_from_token(token)
    current_app.logger.info("Authlib raw claims returned by provider: %s", raw_claims)
    claims = normalize_claims(raw_claims)
    current_app.logger.info("Authlib normalized claims: %s", claims)
    store_authlib_session(token, claims)
    # Pop the saved next URL (if any). If none, redirect to the studio index page.
    app_index = app_root_path().rstrip("/") + "/index.html"
    redirect_target = session.pop("mviewerstudio.auth.next_url", None) or app_index
    return redirect(redirect_target, code=302)


def build_authlib_logout_redirect() -> str:
    """Build a provider logout URL from OIDC discovery metadata when available."""
    redirect_uri = current_app.config.get("OIDC_POST_LOGOUT_REDIRECT_URI", "").strip()
    if not redirect_uri:
        redirect_uri = request.host_url.rstrip("/")
        if redirect_uri.startswith("http://"):
            redirect_uri = "https://" + redirect_uri.split("://", 1)[1]
        redirect_uri = redirect_uri + app_root_path()
    try:
        current_app.logger.info("Building logout redirect: post_logout_redirect_uri=%s", redirect_uri)
    except Exception:
        pass
    token = session.get(AUTHLIB_SESSION_TOKEN_KEY, {})
    if not isinstance(token, dict):
        token = {}

    client = oauth.create_client(AUTHLIB_CLIENT_NAME)
    if client is None:
        try:
            current_app.logger.error("Authlib client not available when building logout redirect")
        except Exception:
            pass
        return app_root_path()

    configured_end_session_endpoint = current_app.config.get(
        "OIDC_END_SESSION_ENDPOINT", ""
    ).strip()
    if configured_end_session_endpoint:
        metadata = {}
        end_session_endpoint = configured_end_session_endpoint
    else:
        metadata = _load_authlib_server_metadata(client)
        end_session_endpoint = metadata.get("end_session_endpoint")
    if not end_session_endpoint:
        try:
            current_app.logger.info(
                "No end_session_endpoint found in provider metadata. metadata_keys=%s",
                list(metadata.keys()),
            )
        except Exception:
            pass
        return app_root_path()

    try:
        current_app.logger.info(
            "Using end_session_endpoint=%s", end_session_endpoint
        )
    except Exception:
        pass

    query = {"post_logout_redirect_uri": redirect_uri}
    id_token = token.get("id_token")
    if id_token:
        query["id_token_hint"] = id_token
    return f"{end_session_endpoint}?{urlencode(query)}"
