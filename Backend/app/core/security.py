from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, SecurityScopes
from config import get_settings


class UnauthenticatedException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Requires authentication"
        )


class UnauthorizedException(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class VerifyToken:
    def __init__(self):
        self.config = get_settings()
        jwks_url = f'https://{self.config.auth0_domain}/.well-known/jwks.json'
        self.jwks_client = jwt.PyJWKClient(jwks_url)
        # Normalize issuer to always include trailing slash to match Auth0 tokens
        self.issuer = (
            self.config.auth0_issuer.rstrip('/') + '/'
            if self.config.auth0_issuer else f'https://{self.config.auth0_domain}/'
        )
        # Support comma-separated algorithms in env
        self.algorithms = (
            [alg.strip() for alg in self.config.auth0_algorithms.split(',')]
            if isinstance(self.config.auth0_algorithms, str)
            else [self.config.auth0_algorithms]
        )

    async def verify(
        self,
        security_scopes: SecurityScopes,
        token: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer())
    ):
        if token is None:
            raise UnauthenticatedException()

        try:
            signing_key = self.jwks_client.get_signing_key_from_jwt(
                token.credentials
            ).key
        except jwt.exceptions.PyJWKClientError as error:
            raise UnauthorizedException(str(error))
        except jwt.exceptions.DecodeError as error:
            raise UnauthorizedException(str(error))

        # Try decoding against both audiences, normalizing issuer and algorithms
        decode_errors = []
        for aud in [self.config.auth0_client_id, self.config.auth0_api_audience]:
            if not aud:
                continue
            try:
                payload = jwt.decode(
                    token.credentials,
                    signing_key,
                    algorithms=self.algorithms,
                    audience=aud,
                    issuer=self.issuer,
                )
                return payload
            except Exception as error:
                decode_errors.append(str(error))

        # If none succeeded, raise a consolidated error
        raise UnauthorizedException(
            "Token validation failed: " + "; ".join(decode_errors) if decode_errors else "Unknown token error"
        )



auth = VerifyToken()
