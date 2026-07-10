from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "ClaimSense AI Backend"
    app_version: str = "1.0.0"
    app_env: str = "development"
    debug: bool = True

    api_prefix: str = "/api/v1"

    host: str = "0.0.0.0"
    port: int = 8000

    allowed_origins: str = "http://localhost:3000"

    sarvam_api_key: str = ""
    convex_url: str = ""
    convex_deploy_key: str = ""
    qdrant_api_key: str = ""
    qdrant_url: str = ""

    log_level: str = "INFO"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
