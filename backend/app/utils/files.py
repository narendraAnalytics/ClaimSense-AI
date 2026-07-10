import os
import re

from fastapi import UploadFile

from app.core.config import settings

_UNSAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]+")

# Magic-byte signatures for the file types we accept. Extension and
# Content-Type are both attacker-controlled (filename string, request
# header) and can be spoofed independently of each other and of the
# actual bytes on the wire — sniffing the real header bytes and cross
# -checking against the claimed type closes that gap.
_MAGIC_SIGNATURES: dict[str, tuple[bytes, ...]] = {
    "application/pdf": (b"%PDF-",),
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/webp": (b"RIFF",),  # RIFF container; WEBP confirmed via bytes 8-12
}


def allowed_extension(filename: str) -> bool:
    _, ext = os.path.splitext(filename)
    return ext.lower() in {".pdf", ".jpg", ".jpeg", ".png", ".webp"}


def allowed_mime(content_type: str | None) -> bool:
    return content_type in settings.allowed_mime_types_list


def sniff_mime_type(upload_file: UploadFile) -> str | None:
    upload_file.file.seek(0)
    header = upload_file.file.read(16)
    upload_file.file.seek(0)

    for mime, signatures in _MAGIC_SIGNATURES.items():
        if not any(header.startswith(sig) for sig in signatures):
            continue
        if mime == "image/webp" and header[8:12] != b"WEBP":
            continue
        return mime
    return None


def calculate_file_size(upload_file: UploadFile) -> int:
    upload_file.file.seek(0, os.SEEK_END)
    size = upload_file.file.tell()
    upload_file.file.seek(0)
    return size


def safe_filename(filename: str) -> str:
    base = os.path.basename(filename)
    return _UNSAFE_CHARS.sub("_", base) or "file"
