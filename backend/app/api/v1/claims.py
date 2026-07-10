from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.constants import ClaimStatus
from app.models.claim import Claim
from app.schemas.claim import CreateClaimRequest, CreateClaimResponse
from app.services.claim_registry import add_claim
from app.utils.ids import generate_claim_id

router = APIRouter(tags=["claims"])


@router.post("/claims", response_model=CreateClaimResponse)
def create_claim(request: CreateClaimRequest) -> CreateClaimResponse:
    now = datetime.now(timezone.utc)
    claim_id = generate_claim_id()

    # No database persistence yet — held in-memory until Convex is wired up in a later phase.
    claim = Claim(
        claim_id=claim_id,
        policy_number=request.policy_number,
        claimant_name=request.claimant_name,
        claim_type=request.claim_type,
        incident_date=request.incident_date,
        incident_description=request.incident_description,
        status=ClaimStatus.NEW,
        created_at=now,
        updated_at=now,
    )
    add_claim(claim)

    return CreateClaimResponse(
        claim_id=claim.claim_id,
        status=claim.status,
        created_at=claim.created_at,
        message="Claim created successfully",
    )
