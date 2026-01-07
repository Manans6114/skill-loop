from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str
    
    # Auth0
    auth0_domain: str
    auth0_api_audience: str
    auth0_issuer: str
    auth0_algorithms: str
    auth0_client_id: Optional[str] = None
    auth0_client_secret: Optional[str] = None
    
    # App
    app_name: str = "skillLoop API"
    debug: bool = False
    secret_key: str = "your-secret-key-change-in-production"
    frontend_url: str = "http://localhost:5173"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings():
    return Settings()
