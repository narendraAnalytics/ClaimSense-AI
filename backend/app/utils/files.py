import os
import re

from fastapi import UploadFile

from app.core.config import settings

_UNSAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]+")


def allowed_extension(filename: str) -> bool:
    _, ext = os.path.splitext(filename)
    return ext.lower() in {".pdf", ".jpg", ".jpeg", ".png", ".webp"}


def allowed_mime(content_type: str | None) -> bool:
    return content_type in settings.allowed_mime_types_list


def calculate_file_size(upload_file: UploadFile) -> int:
    upload_file.file.seek(0, os.SEEK_END)
    size = upload_file.file.tell()
    upload_file.file.seek(0)
    return size


def safe_filename(filename: str) -> str:
    base = os.path.basename(filename)
    return _UNSAFE_CHARS.sub("_", base) or "file"
