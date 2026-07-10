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
    uploadthing_token: str = ""

    log_level: str = "INFO"

    upload_dir: str = "uploads/temp"
    max_upload_size_mb: int = 25
    allowed_upload_mime_types: str = "image/jpeg,image/png,image/webp,application/pdf"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def allowed_mime_types_list(self) -> list[str]:
        return [mime.strip() for mime in self.allowed_upload_mime_types.split(",") if mime.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
