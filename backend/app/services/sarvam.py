import time
from functools import lru_cache

import httpx

from app.core.config import settings
from app.core.logger import logger


class SarvamVisionError(Exception):
    pass


class SarvamVisionClient:
    """Wraps Sarvam's Document Intelligence job pipeline: create job -> get
    upload URLs -> upload file -> start job -> poll status -> get download
    URLs -> download result. See docs.sarvam.ai/api-reference-docs/document-intelligence.
    """

    def __init__(self) -> None:
        self._client = httpx.Client(
            base_url=settings.sarvam_base_url,
            headers={"api-subscription-key": settings.sarvam_api_key},
            timeout=30.0,
        )

    def create_document_job(self, language: str | None = None, output_format: str | None = None) -> dict:
        response = self._client.post(
            "/doc-digitization/job/v1",
            json={
                "job_parameters": {
                    "language": language or settings.sarvam_vision_language,
                    "output_format": output_format or settings.sarvam_vision_output_format,
                }
            },
        )
        self._raise_for_status(response)
        return response.json()

    def get_upload_urls(self, job_id: str, filename: str) -> dict:
        response = self._client.post(
            "/doc-digitization/job/v1/upload-files",
            json={"job_id": job_id, "files": [filename]},
        )
        self._raise_for_status(response)
        return response.json()

    def upload_file(self, upload_url: str, file_bytes: bytes, content_type: str) -> None:
        # Azure blob SAS URLs require this header for a PUT to succeed.
        response = httpx.put(
            upload_url,
            content=file_bytes,
            headers={"Content-Type": content_type, "x-ms-blob-type": "BlockBlob"},
            timeout=60.0,
        )
        if response.status_code >= 400:
            raise SarvamVisionError(
                f"Upload to Sarvam storage failed ({response.status_code}): {response.text[:500]}"
            )

    def start_job(self, job_id: str) -> dict:
        response = self._client.post(f"/doc-digitization/job/v1/{job_id}/start", json={})
        self._raise_for_status(response)
        return response.json()

    def get_job_status(self, job_id: str) -> dict:
        response = self._client.get(f"/doc-digitization/job/v1/{job_id}/status")
        self._raise_for_status(response)
        return response.json()

    def get_download_urls(self, job_id: str) -> dict:
        response = self._client.post(f"/doc-digitization/job/v1/{job_id}/download-files", json={})
        self._raise_for_status(response)
        return response.json()

    def wait_until_complete(self, job_id: str) -> dict:
        deadline = time.monotonic() + settings.sarvam_poll_timeout_seconds
        while True:
            status = self.get_job_status(job_id)
            job_state = status.get("job_state")
            if job_state in ("Completed", "PartiallyCompleted"):
                return status
            if job_state == "Failed":
                raise SarvamVisionError(f"Sarvam job {job_id} failed: {status.get('error_message')}")
            if time.monotonic() >= deadline:
                raise SarvamVisionError(
                    f"Sarvam job {job_id} did not complete within "
                    f"{settings.sarvam_poll_timeout_seconds}s (last state: {job_state})"
                )
            time.sleep(settings.sarvam_poll_interval_seconds)

    def download_result(self, download_url: str) -> bytes:
        response = httpx.get(download_url, timeout=60.0)
        if response.status_code >= 400:
            raise SarvamVisionError(
                f"Downloading Sarvam output failed ({response.status_code}): {response.text[:500]}"
            )
        return response.content

    def extract_document(
        self,
        document_bytes: bytes,
        filename: str,
        content_type: str,
        language: str | None = None,
        output_format: str | None = None,
    ) -> bytes:
        """Runs the full job pipeline for a single document and returns the
        downloaded output ZIP bytes (contains document.md/html plus
        metadata/page_*.json with per-page structured data)."""
        job = self.create_document_job(language, output_format)
        job_id = job["job_id"]
        logger.info(f"[sarvam] created document intelligence job {job_id} for '{filename}'")

        upload_info = self.get_upload_urls(job_id, filename)
        upload_url = upload_info["upload_urls"][filename]["file_url"]
        self.upload_file(upload_url, document_bytes, content_type)

        self.start_job(job_id)
        self.wait_until_complete(job_id)

        download_info = self.get_download_urls(job_id)
        output_filename = next(iter(download_info["download_urls"]))
        output_url = download_info["download_urls"][output_filename]["file_url"]
        logger.info(f"[sarvam] job {job_id} completed, downloading '{output_filename}'")
        return self.download_result(output_url)

    def _raise_for_status(self, response: httpx.Response) -> None:
        if response.status_code >= 400:
            raise SarvamVisionError(
                f"Sarvam API error ({response.status_code}) on {response.request.url}: "
                f"{response.text[:500]}"
            )


@lru_cache
def get_sarvam_client() -> SarvamVisionClient:
    return SarvamVisionClient()


class SarvamChatError(Exception):
    pass


class SarvamChatClient:
    """Wraps Sarvam's OpenAI-compatible chat completions endpoint
    (`/v1/chat/completions`, Sarvam-30B/105B). See
    docs.sarvam.ai/api-reference-docs/chat/chat-completions.
    """

    def __init__(self) -> None:
        self._client = httpx.Client(
            base_url=settings.sarvam_base_url,
            headers={"api-subscription-key": settings.sarvam_api_key},
            timeout=settings.sarvam_chat_timeout_seconds,
        )

    def chat_completion(
        self,
        messages: list[dict],
        response_format: dict | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        reasoning_effort: str | None = None,
    ) -> dict:
        payload = {
            "model": settings.sarvam_chat_model,
            "messages": messages,
            "temperature": temperature if temperature is not None else settings.sarvam_chat_temperature,
            "max_tokens": max_tokens or settings.sarvam_chat_max_tokens,
            "n": 1,
            "reasoning_effort": reasoning_effort or settings.sarvam_chat_reasoning_effort,
        }
        if response_format:
            payload["response_format"] = response_format

        try:
            response = self._client.post("/v1/chat/completions", json=payload)
        except httpx.HTTPError as exc:
            raise SarvamChatError(f"Sarvam chat API request failed: {exc}") from exc
        self._raise_for_status(response)
        return response.json()

    def _raise_for_status(self, response: httpx.Response) -> None:
        if response.status_code >= 400:
            raise SarvamChatError(
                f"Sarvam chat API error ({response.status_code}) on {response.request.url}: "
                f"{response.text[:500]}"
            )


@lru_cache
def get_sarvam_chat_client() -> SarvamChatClient:
    return SarvamChatClient()
