from datetime import date, datetime
from typing import Literal

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
    billing_result: dict | None = None
    billing_status: str | None = None
    fraud_result: dict | None = None
    fraud_status: str | None = None
    historical_result: dict | None = None
    historical_status: str | None = None
    settlement_result: dict | None = None
    settlement_status: str | None = None
    report_result: dict | None = None
    report_status: str | None = None
    report_url: str | None = None
    errors: list[str]
    message: str


class OfficerDecisionRequest(BaseModel):
    decision: Literal["approve", "reject", "modify"]
    modified_amount: float | None = None
    notes: str | None = None
