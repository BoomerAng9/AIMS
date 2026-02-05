# oidc_verify.py
from functools import lru_cache
from typing import Dict, Any, Optional

import httpx
import jwt
from jwt import PyJWKClient, InvalidTokenError, PyJWTError


class OIDCConfigError(RuntimeError):
    pass


def _get_http(timeout: float = 10.0) -> httpx.Client:
    return httpx.Client(timeout=timeout)


def fetch_discovery(issuer: str) -> Dict[str, Any]:
    """GET {issuer}/.well-known/openid-configuration"""
    issuer = issuer.rstrip("/")
    url = f"{issuer}/.well-known/openid-configuration"
    with _get_http() as client:
        r = client.get(url)
        if r.status_code != 200:
            raise OIDCConfigError(f"Discovery fetch failed: HTTP {r.status_code} - {r.text}")
        return r.json()


@lru_cache(maxsize=8)
def _jwks_client(jwks_uri: str) -> PyJWKClient:
    return PyJWKClient(jwks_uri, headers={
        "User-Agent": "ii-agent-oauth2/1.0",
        "Accept": "application/json",
    })


def verify_id_token_pyjwt(
    id_token: str,
    issuer: str,
    audience: str,
    expected_nonce: Optional[str] = None,
    leeway: int = 60,
) -> Dict[str, Any]:
    """
    Validate an ID token using PyJWT and the provider JWKS:
    - Verifies signature (RS/ES families, etc.).
    - Ensures claims like iss / aud / exp / iat / (optional) nonce.
    """
    cfg = fetch_discovery(issuer)
    jwks_uri = cfg.get("jwks_uri")
    if not jwks_uri:
        raise OIDCConfigError("jwks_uri missing in discovery document")

    jwk_client = _jwks_client(jwks_uri)
    signing_key = jwk_client.get_signing_key_from_jwt(id_token).key

    try:
        claims = jwt.decode(
            id_token,
            signing_key,
            algorithms=cfg.get("id_token_signing_alg_values_supported", ["RS256"]),
            audience=audience,  # client_id issued for this application
            issuer=issuer,
            leeway=leeway,      # allow slight clock skew
            options={
                "require": ["exp", "iat", "aud", "iss", "sub"],
            },
        )
    except (InvalidTokenError, PyJWTError) as e:
        raise RuntimeError(f"ID token verification failed: {e}") from e

    if expected_nonce is not None:
        tok_nonce = claims.get("nonce")
        if not tok_nonce or tok_nonce != expected_nonce:
            raise RuntimeError("Invalid nonce")

    return claims


def verify_at_hash_if_present(
    claims: Dict[str, Any],
    access_token: Optional[str],
    alg: str = "RS256",
) -> None:
    """
    Optionally validate the at_hash claim when provided by the IdP.
    No error when at_hash is absent; if present, verify it matches the access token.
    """
    at_hash = claims.get("at_hash")
    if not at_hash or not access_token:
        return

    import hashlib, base64

    # Per JWA spec: use the left-most half of the hash, then base64url encode it
    hash_fn = {"RS256": "sha256", "ES256": "sha256", "PS256": "sha256"}.get(alg, "sha256")
    digest = getattr(hashlib, hash_fn)(access_token.encode("ascii")).digest()
    left_half = digest[: len(digest) // 2]
    calc = base64.urlsafe_b64encode(left_half).rstrip(b"=").decode("ascii")

    if calc != at_hash:
        raise RuntimeError("at_hash mismatch")
