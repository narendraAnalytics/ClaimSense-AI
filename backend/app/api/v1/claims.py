from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse

from app.api.deps import get_existing_claim
from app.core.constants import ClaimStatus
from app.graph.state import ClaimState
from app.models.claim import Claim
from app.schemas.claim import (
    CreateClaimRequest,
    CreateClaimResponse,
    OfficerDecisionRequest,
    ProcessClaimResponse,
)
from app.services import workflow
from app.services.claim_registry import add_claim
from app.services.document_registry import get_documents_for_claim
from app.services.report_generator import REPORTS_DIR
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

    # Deliberately does NOT invoke the pipeline graph here (it used to, as a
    # Phase 5 orchestration smoke test) — with checkpointing wired in
    # (app/graph/checkpointer.py), a graph run at creation time would create
    # a completed checkpoint under this claim's thread_id before any
    # documents exist, which would make the real POST /process call below
    # resume into that empty-document terminal state instead of processing
    # the actually-uploaded documents. Upload happens after creation, so the
    # first real graph run belongs to /process.

    return CreateClaimResponse(
        claim_id=claim.claim_id,
        status=claim.status,
        created_at=claim.created_at,
        message="Claim created; upload documents and call /process to run the pipeline.",
    )


def _build_process_response(claim: Claim, result: ClaimState, message: str) -> ProcessClaimResponse:
    policy_result = result.get("policy_result")
    policy_status = result.get("policy_status")
    medical_result = result.get("medical_result")
    medical_status = result.get("medical_status")
    billing_result = result.get("billing_result")
    billing_status = result.get("billing_status")
    fraud_result = result.get("fraud_result")
    fraud_status = result.get("fraud_status")
    historical_result = result.get("historical_result")
    historical_status = result.get("historical_status")
    settlement_result = result.get("settlement_result")
    settlement_status = result.get("settlement_status")
    report_result = result.get("report_result")
    report_status = result.get("report_status")

    return ProcessClaimResponse(
        claim_id=claim.claim_id,
        status=claim.status,
        workflow_history=result["workflow_history"],
        document_status=result["document_status"],
        document_summary=result["document_summary"],
        policy_result=policy_result.model_dump(mode="json") if policy_result else None,
        policy_status=policy_status.value if policy_status else None,
        medical_result=medical_result.model_dump(mode="json") if medical_result else None,
        medical_status=medical_status.value if medical_status else None,
        billing_result=billing_result.model_dump(mode="json") if billing_result else None,
        billing_status=billing_status.value if billing_status else None,
        fraud_result=fraud_result.model_dump(mode="json") if fraud_result else None,
        fraud_status=fraud_status.value if fraud_status else None,
        historical_result=historical_result.model_dump(mode="json") if historical_result else None,
        historical_status=historical_status.value if historical_status else None,
        settlement_result=settlement_result.model_dump(mode="json") if settlement_result else None,
        settlement_status=settlement_status.value if settlement_status else None,
        report_result=report_result.model_dump(mode="json") if report_result else None,
        report_status=report_status.value if report_status else None,
        report_url=result.get("report_url"),
        errors=result["errors"],
        message=message,
    )


@router.post("/claims/{claim_id}/process", response_model=ProcessClaimResponse)
async def process_claim(
    claim: Claim = Depends(get_existing_claim),
    force: bool = Query(
        False,
        description=(
            "Discard any cached checkpoint for this claim and re-run the full pipeline "
            "from scratch — use after adding/replacing documents on an already-processed claim."
        ),
    ),
) -> ProcessClaimResponse:
    documents = get_documents_for_claim(claim.claim_id)

    # Checkpointed: a claim already fully processed returns its cached final
    # state instantly (no repeat OCR/LLM calls/credits) unless force=true.
    result = await workflow.resume_workflow(claim, documents, force=force)

    claim.status = result["status"]
    claim.updated_at = result["updated_at"]

    if claim.status == ClaimStatus.AWAITING_APPROVAL:
        message = "Claim processing paused: awaiting claims officer decision"
    elif result["errors"]:
        message = "Claim processing halted: " + "; ".join(result["errors"])
    else:
        message = "Claim processing pipeline completed"

    return _build_process_response(claim, result, message)


@router.post("/claims/{claim_id}/decision", response_model=ProcessClaimResponse)
async def submit_decision(
    request: OfficerDecisionRequest,
    claim: Claim = Depends(get_existing_claim),
) -> ProcessClaimResponse:
    try:
        result = await workflow.submit_officer_decision(
            claim.claim_id, request.decision, request.modified_amount, request.notes
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    claim.status = ClaimStatus.REJECTED if request.decision == "reject" else ClaimStatus.APPROVED
    claim.updated_at = result["updated_at"]

    message = (
        "Claim finalized by claims officer"
        if not result["errors"]
        else "Claim finalized with errors: " + "; ".join(result["errors"])
    )

    return _build_process_response(claim, result, message)


@router.get("/claims/{claim_id}/report")
def download_report(claim: Claim = Depends(get_existing_claim)) -> FileResponse:
    # Reads the PDF the Report agent already wrote to disk during a prior
    # POST /process call, using report_generator's deterministic naming
    # convention — deliberately does NOT re-run the graph (that would
    # re-spend real Sarvam credits on every download, same reasoning as
    # why there's no checkpointing yet, see backend/CLAUDE.md).
    report_path = REPORTS_DIR / f"{claim.claim_id}.pdf"
    if not report_path.exists():
        raise HTTPException(
            status_code=404, detail="Report not yet generated for this claim — call /process first"
        )

    return FileResponse(
        path=str(report_path),
        media_type="application/pdf",
        filename=f"{claim.claim_id}_report.pdf",
    )
