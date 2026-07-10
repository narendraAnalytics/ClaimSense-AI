from fastapi import HTTPException

from app.models.claim import Claim
from app.services.claim_registry import get_claim


def get_existing_claim(claim_id: str) -> Claim:
    claim = get_claim(claim_id)
    if claim is None:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")
    return claim
