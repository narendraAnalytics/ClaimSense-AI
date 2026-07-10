from datetime import datetime, timezone
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings
from app.utils.files import allowed_extension, allowed_mime, calculate_file_size, safe_filename
from app.utils.ids import generate_document_id


class FileValidationError(Exception):
    pass


def validate_file(upload_file: UploadFile) -> None:
    if not allowed_extension(upload_file.filename or ""):
        raise FileValidationError(f"Unsupported file extension for '{upload_file.filename}'")
    if not allowed_mime(upload_file.content_type):
        raise FileValidationError(f"Unsupported content type '{upload_file.content_type}'")
    size = calculate_file_size(upload_file)
    if size > settings.max_upload_size_bytes:
        raise FileValidationError(
            f"File '{upload_file.filename}' exceeds the {settings.max_upload_size_mb}MB limit"
        )


async def save_temp_file(upload_file: UploadFile, claim_id: str, document_id: str) -> Path:
    claim_dir = Path(settings.upload_dir) / claim_id
    claim_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{document_id}_{safe_filename(upload_file.filename or 'file')}"
    destination = claim_dir / filename

    upload_file.file.seek(0)
    with destination.open("wb") as out_file:
        while chunk := await upload_file.read(1024 * 1024):
            out_file.write(chunk)

    return destination


def get_file_metadata(path: Path, upload_file: UploadFile) -> dict:
    return {
        "filename": upload_file.filename or path.name,
        "mime_type": upload_file.content_type or "application/octet-stream",
        "extension": path.suffix.lower(),
        "size": path.stat().st_size,
        "uploaded_at": datetime.now(timezone.utc),
    }


__all__ = [
    "FileValidationError",
    "validate_file",
    "generate_document_id",
    "save_temp_file",
    "get_file_metadata",
]
