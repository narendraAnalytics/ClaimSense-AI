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
    sarvam_base_url: str = "https://api.sarvam.ai"
    sarvam_vision_language: str = "en-IN"
    # Sarvam's job API only accepts "html" or "md" for job_parameters.output_format
    # (confirmed against the live API — "json" is rejected at job creation) — the
    # per-page JSON in metadata/page_*.json is always included in the output ZIP
    # regardless of this setting.
    sarvam_vision_output_format: str = "md"
    sarvam_poll_interval_seconds: float = 3.0
    sarvam_poll_timeout_seconds: float = 180.0
    sarvam_chat_model: str = "sarvam-30b"
    sarvam_chat_temperature: float = 0.1
    # Reasoning-model output spends part of this budget on hidden reasoning
    # tokens before the final JSON answer — too low a cap truncates the
    # response to an empty/null message.content. 4096 is the hard ceiling
    # for sarvam-30b on the starter subscription tier (confirmed via a 400
    # from the live API) — raise this if the account is upgraded.
    sarvam_chat_max_tokens: int = 4096
    # None disables reasoning entirely (per Sarvam's docs, sent as explicit
    # JSON null) — even "low" reasoning_effort was consuming the whole
    # 4096-token budget on hidden reasoning before any JSON answer, leaving
    # message.content empty. This is a straightforward extraction task, not
    # one needing chain-of-thought, so disabling it is both cheaper and
    # fixes truncation.
    sarvam_chat_reasoning_effort: str | None = None
    sarvam_chat_timeout_seconds: float = 120.0
    sarvam_chat_max_input_chars: int = 30000
    convex_url: str = ""
    convex_deploy_key: str = ""
    # The .convex.site domain httpActions live on, distinct from convex_url's
    # .convex.cloud (RPC endpoint) — used only for the raw-bytes file-storage
    # bridge (see app/services/storage.py), since ctx.storage.store() needs
    # actual request bytes that the convex-py client's JSON-args RPC can't carry.
    convex_site_url: str = ""
    backend_upload_secret: str = ""
    qdrant_api_key: str = ""
    qdrant_url: str = ""
    uploadthing_token: str = ""

    log_level: str = "INFO"

    upload_dir: str = "uploads/temp"
    max_upload_size_mb: int = 25
    allowed_upload_mime_types: str = "image/jpeg,image/png,image/webp,application/pdf"
    # Whole-request cap (multiple files per upload call) checked via
    # Content-Length before the multipart body is parsed/buffered.
    max_request_size_mb: int = 100

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def max_request_size_bytes(self) -> int:
        return self.max_request_size_mb * 1024 * 1024

    @property
    def allowed_mime_types_list(self) -> list[str]:
        return [mime.strip() for mime in self.allowed_upload_mime_types.split(",") if mime.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
