from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.api.deps import get_existing_claim
from app.core.constants import ClaimStatus
from app.models.claim import Claim
from app.schemas.claim import CreateClaimRequest, CreateClaimResponse, ProcessClaimResponse
from app.services import workflow
from app.services.claim_registry import add_claim
from app.services.document_registry import get_documents_for_claim
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

    # No documents exist yet at creation time — upload happens afterward.
    # This still proves the orchestration mechanics: Intake -> Supervisor -> Policy.
    result = workflow.start_workflow(claim, documents=[])
    claim.status = result["status"]
    claim.updated_at = result["updated_at"]

    return CreateClaimResponse(
        claim_id=claim.claim_id,
        status=claim.status,
        created_at=claim.created_at,
        message=f"Claim created; workflow reached: {' -> '.join(result['workflow_history'])}",
    )


@router.post("/claims/{claim_id}/process", response_model=ProcessClaimResponse)
def process_claim(claim: Claim = Depends(get_existing_claim)) -> ProcessClaimResponse:
    documents = get_documents_for_claim(claim.claim_id)

    # No graph-level persistence yet, so there's no genuine prior run to
    # pass in here — resume_workflow() re-initializes from scratch. Once
    # checkpointing exists, `previous_state` would come from a real saved run.
    result = workflow.resume_workflow(claim, documents)

    claim.status = result["status"]
    claim.updated_at = result["updated_at"]

    message = (
        "Claim processing pipeline completed"
        if not result["errors"]
        else "Claim processing halted: " + "; ".join(result["errors"])
    )

    return ProcessClaimResponse(
        claim_id=claim.claim_id,
        status=claim.status,
        workflow_history=result["workflow_history"],
        document_status=result["document_status"],
        document_summary=result["document_summary"],
        errors=result["errors"],
        message=message,
    )
