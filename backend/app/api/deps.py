from fastapi import HTTPException, Request

from app.core.config import settings
from app.models.claim import Claim
from app.services.convex_registry import load_claim


async def get_existing_claim(claim_id: str) -> Claim:
    claim = await load_claim(claim_id)
    if claim is None:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")
    return claim


def enforce_max_request_size(request: Request) -> None:
    # Runs as a sub-dependency, which FastAPI resolves before it parses
    # the endpoint's own File/Form body params — this rejects oversized
    # requests before the multipart body is buffered into memory/disk,
    # rather than after (a Content-Length check performed post-parse
    # can only detect excess resource use, not bound it).
    content_length = request.headers.get("content-length")
    if content_length is not None and int(content_length) > settings.max_request_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Request exceeds the {settings.max_request_size_mb}MB limit",
        )
