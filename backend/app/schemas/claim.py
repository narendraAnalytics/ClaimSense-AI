from datetime import date, datetime

from pydantic import BaseModel

from app.core.constants import ClaimStatus, DocumentStatus
from app.schemas.document import DocumentMetadata


class CreateClaimRequest(BaseModel):
    policy_number: str
    claimant_name: str
    claim_type: str
    incident_date: date
    incident_description: str


class CreateClaimResponse(BaseModel):
    claim_id: str
    status: ClaimStatus
    created_at: datetime
    message: str


class ClaimSummary(BaseModel):
    claim_id: str
    policy_number: str
    claimant_name: str
    status: ClaimStatus
    created_at: datetime
    document_count: int


class ClaimDetails(ClaimSummary):
    claim_type: str
    incident_date: date
    incident_description: str
    documents: list[DocumentMetadata]
    updated_at: datetime


class ProcessClaimResponse(BaseModel):
    claim_id: str
    status: ClaimStatus
    workflow_history: list[str]
    document_status: DocumentStatus
    document_summary: dict
    policy_result: dict | None = None
    policy_status: str | None = None
    medical_result: dict | None = None
    medical_status: str | None = None
    errors: list[str]
    message: str
