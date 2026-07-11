from datetime import datetime, timezone

from app.core.constants import DocumentStatus
from app.graph.state import ClaimState
from app.models.claim import Claim
from app.models.document import Document


def initialize_claim_state(claim: Claim, documents: list[Document]) -> ClaimState:
    now = datetime.now(timezone.utc)
    return ClaimState(
        claim_id=claim.claim_id,
        claim=claim,
        status=claim.status,
        documents=documents,
        parsed_documents=[],
        document_summary={},
        document_status=DocumentStatus.PENDING,
        policy_result=None,
        policy_status=None,
        coverage_summary=None,
        coverage_decision=None,
        medical_result=None,
        medical_status=None,
        medical_summary=None,
        medical_decision=None,
        current_agent="intake",
        next_agent="document",
        messages=[],
        errors=[],
        metadata={},
        workflow_history=["intake"],
        started_at=now,
        updated_at=now,
    )
