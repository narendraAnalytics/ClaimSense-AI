from datetime import datetime, timezone
from pathlib import Path

import httpx
from fastapi import UploadFile

from app.core.config import settings
from app.services.convex_client import convex_query
from app.utils.files import (
    allowed_extension,
    allowed_mime,
    calculate_file_size,
    safe_filename,
    sniff_mime_type,
)
from app.utils.ids import generate_document_id


class FileValidationError(Exception):
    pass


def validate_file(upload_file: UploadFile) -> None:
    if not allowed_extension(upload_file.filename or ""):
        raise FileValidationError(f"Unsupported file extension for '{upload_file.filename}'")
    if not allowed_mime(upload_file.content_type):
        raise FileValidationError(f"Unsupported content type '{upload_file.content_type}'")
    sniffed = sniff_mime_type(upload_file)
    if sniffed is None or sniffed != upload_file.content_type:
        raise FileValidationError(
            f"File '{upload_file.filename}' content does not match its declared type"
        )
    size = calculate_file_size(upload_file)
    if size > settings.max_upload_size_bytes:
        raise FileValidationError(
            f"File '{upload_file.filename}' exceeds the {settings.max_upload_size_mb}MB limit"
        )


class FileStorageError(Exception):
    pass


async def upload_file_bytes(data: bytes, filename: str, content_type: str) -> str:
    """Stores file bytes in Convex File Storage, returning the storage ID.

    Goes over plain HTTP to the Convex deployment's .convex.site httpAction
    (see frontend/convex/http.ts), not the convex-py RPC client — ctx.storage.store()
    needs the actual request bytes, which the client's JSON-args mutation/query
    interface can't carry.
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.convex_site_url}/backend/storeFile",
            headers={
                "x-backend-secret": settings.backend_upload_secret,
                "Content-Type": content_type,
            },
            content=data,
        )
    if response.status_code != 200:
        raise FileStorageError(
            f"Storing '{filename}' to Convex failed with status {response.status_code}: {response.text}"
        )
    return response.json()["storageId"]


async def get_file_url(storage_id: str) -> str:
    url = await convex_query("files:getFileUrl", {"storageId": storage_id})
    if url is None:
        raise FileStorageError(f"No file found for storage ID '{storage_id}'")
    return url


async def get_file_bytes(storage_id: str) -> bytes:
    url = await get_file_url(storage_id)
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(url)
    response.raise_for_status()
    return response.content


def get_file_metadata(upload_file: UploadFile, data: bytes) -> dict:
    filename = upload_file.filename or "file"
    return {
        "filename": filename,
        "mime_type": upload_file.content_type or "application/octet-stream",
        "extension": Path(safe_filename(filename)).suffix.lower(),
        "size": len(data),
        "uploaded_at": datetime.now(timezone.utc),
    }


__all__ = [
    "FileValidationError",
    "FileStorageError",
    "validate_file",
    "generate_document_id",
    "upload_file_bytes",
    "get_file_url",
    "get_file_bytes",
    "get_file_metadata",
]
