import operator
from datetime import datetime
from typing import Annotated

from typing_extensions import TypedDict

from app.core.constants import (
    BillingValidationStatus,
    ClaimStatus,
    DocumentStatus,
    FraudAssessmentStatus,
    HistoryStatus,
    MedicalValidationStatus,
    PolicyExtractionStatus,
    ReportStatus,
    SettlementDecision,
)
from app.core.types import ClaimID
from app.models.billing import BillingResult
from app.models.claim import Claim
from app.models.document import Document
from app.models.document_result import DocumentResult
from app.models.fraud import FraudResult
from app.models.history import HistoryResult
from app.models.medical import MedicalResult
from app.models.policy import PolicyResult
from app.models.report import ReportResult
from app.models.settlement import SettlementResult


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
    billing_result: BillingResult | None
    billing_status: BillingValidationStatus | None
    payable_amount: float | None
    billing_summary: str | None
    fraud_result: FraudResult | None
    fraud_status: FraudAssessmentStatus | None
    fraud_score: int | None
    historical_result: HistoryResult | None
    historical_status: HistoryStatus | None
    settlement_result: SettlementResult | None
    settlement_status: SettlementDecision | None
    recommended_amount: float | None
    report_result: ReportResult | None
    report_status: ReportStatus | None
    report_url: str | None
    current_agent: str | None
    next_agent: str | None
    messages: Annotated[list[str], operator.add]
    errors: Annotated[list[str], operator.add]
    metadata: dict
    workflow_history: Annotated[list[str], operator.add]
    started_at: datetime
    updated_at: datetime
