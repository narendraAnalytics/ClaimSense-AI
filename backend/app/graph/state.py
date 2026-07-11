import operator
from datetime import datetime
from typing import Annotated

from typing_extensions import TypedDict

from app.core.constants import ClaimStatus, DocumentStatus, MedicalValidationStatus, PolicyExtractionStatus
from app.core.types import ClaimID
from app.models.claim import Claim
from app.models.document import Document
from app.models.document_result import DocumentResult
from app.models.medical import MedicalResult
from app.models.policy import PolicyResult


class ClaimState(TypedDict):
    claim_id: ClaimID
    claim: Claim
    status: ClaimStatus
    documents: list[Document]
    parsed_documents: Annotated[list[DocumentResult], operator.add]
    document_summary: dict
    document_status: DocumentStatus
    policy_result: PolicyResult | None
    policy_status: PolicyExtractionStatus | None
    coverage_summary: str | None
    coverage_decision: bool | None
    medical_result: MedicalResult | None
    medical_status: MedicalValidationStatus | None
    medical_summary: str | None
    medical_decision: bool | None
    current_agent: str | None
    next_agent: str | None
    messages: Annotated[list[str], operator.add]
    errors: Annotated[list[str], operator.add]
    metadata: dict
    workflow_history: Annotated[list[str], operator.add]
    started_at: datetime
    updated_at: datetime
