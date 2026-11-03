"""User adapter for OIDC identities forwarded by a reverse proxy or gateway.

This adapter reads standard forwarded user headers first and optionally uses a
forwarded bearer/access token as a fallback source for claims.
"""

import base64
import json
import logging

from flask import request

from ...models.user import User
from .common import build_user, first_header, split_roles

logger = logging.getLogger(__name__)


def _normalize_group_entries(entries: list[str]) -> tuple[object | None, list[str]]:
    """Split mixed group values into a primary organization and extra roles."""
    organization = None
    roles: list[str] = []
    for entry in entries:
        if not entry:
            continue
        if entry.startswith("role:"):
            roles.append(entry.removeprefix("role:"))
            continue
        if organization is None:
            organization = entry
            continue
        roles.append(entry)
    return organization, roles or [""]


def _extract_header_claims() -> dict[str, object]:
    """Read user claims from forwarded authentication headers."""
    explicit_roles = split_roles(
        first_header("X-Forwarded-Roles", "X-Auth-Request-Roles")
    )
    group_entries = split_roles(
        first_header(
            "X-Forwarded-Groups",
            "X-Auth-Request-Groups",
            "X-Organizations",
        )
    )
    derived_organization, normalized_roles = _normalize_group_entries(group_entries)
    organization = (
        first_header("X-Forwarded-Org", "X-Auth-Request-Org") or derived_organization
    )
    return {
        "preferred_username": first_header(
            "X-Forwarded-Preferred-Username",
            "X-Auth-Request-Preferred-Username",
            "X-Forwarded-User",
            "X-Auth-Request-User",
            "Remote-User",
        ),
        "given_name": first_header(
            "X-Forwarded-Given-Name", "X-Auth-Request-Given-Name"
        ),
        "family_name": first_header(
            "X-Forwarded-Family-Name", "X-Auth-Request-Family-Name"
        ),
        "organization": organization,
        "roles": explicit_roles if explicit_roles != [""] else normalized_roles,
    }


def _decode_jwt_payload(token: str) -> dict[str, object]:
    """Decode a JWT payload without validating its signature.

    This is only used as a convenience fallback when a gateway forwards an
    access token but not all expected identity headers.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return {}
        payload = parts[1]
        payload += "=" * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload.encode("ascii"))
        data = json.loads(decoded.decode("utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        logger.exception("Failed to decode OIDC JWT payload")
        return {}


def _extract_token_claims() -> dict[str, object]:
    """Read fallback user claims from a forwarded or bearer access token."""
    authorization = request.headers.get("Authorization", "")
    token = request.headers.get("X-Forwarded-Access-Token") or request.headers.get(
        "X-Auth-Request-Access-Token"
    )

    if not token and authorization.startswith("Bearer "):
        token = authorization[len("Bearer ") :]
    if not token:
        return {}
    #logger.debug("OIDC token: %s", token)

    payload = _decode_jwt_payload(token)
    roles = payload.get("roles")
    realm_access = payload.get("realm_access", {})
    if not isinstance(roles, list):
        if isinstance(realm_access, dict):
            roles = realm_access.get("roles", [])
    resource_access = payload.get("resource_access", {})
    if isinstance(resource_access, dict):
        mviewerstudio_access = resource_access.get("mviewerstudio", {})
    else:
        mviewerstudio_access = {}
    logger.info(
        "OIDC token payload summary: %s",
        json.dumps(
            {
                "preferred_username": payload.get("preferred_username"),
                "email": payload.get("email"),
                "organization": payload.get("organization"),
                "roles": roles,
                "realm_roles": realm_access.get("roles", [])
                if isinstance(realm_access, dict)
                else [],
                "mviewerstudio_roles": mviewerstudio_access.get("roles", [])
                if isinstance(mviewerstudio_access, dict)
                else [],
                "aud": payload.get("aud"),
                "azp": payload.get("azp"),
                "iss": payload.get("iss"),
            },
            ensure_ascii=True,
        ),
    )

    given_name = payload.get("given_name")
    family_name = payload.get("family_name")
    full_name = payload.get("name")
    if full_name and (not given_name or not family_name):
        names = str(full_name).split(" ", 1)
        if not given_name and names:
            given_name = names[0]
        if not family_name and len(names) > 1:
            family_name = names[1]

    return {
        "preferred_username": payload.get("preferred_username"),
        "given_name": given_name,
        "family_name": family_name,
        "organization": payload.get("organization"),
        "roles": [str(role) for role in roles] if isinstance(roles, list) else [""],
    }


def _extract_claims() -> dict[str, object]:
    """Merge header-derived claims with token-derived fallback values."""
    header_claims = _extract_header_claims()
    token_claims = _extract_token_claims()

    claims = {
        "preferred_username": header_claims["preferred_username"]
        or token_claims.get("preferred_username"),
        "given_name": header_claims["given_name"] or token_claims.get("given_name"),
        "family_name": header_claims["family_name"]
        or token_claims.get("family_name"),
        "organization": header_claims["organization"]
        or token_claims.get("organization"),
        "roles": header_claims["roles"],
    }
    if claims["roles"] == [""] and token_claims.get("roles"):
        claims["roles"] = token_claims["roles"]
    return claims


def get_user() -> User:
    """Build the authenticated user from OIDC headers and token-derived claims."""
    claims = _extract_claims()
    logger.info("OIDC claims: %s", json.dumps(claims, ensure_ascii=True))
    return build_user(
        claims["preferred_username"],
        claims["given_name"],
        claims["family_name"],
        claims["organization"],
        claims["roles"],
    )
