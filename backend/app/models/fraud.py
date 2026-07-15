from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.core.constants import FraudLevel


class FraudResult(BaseModel):
    # No document_id — fraud reasons over the whole claim plus prior agent
    # results, not a single document, unlike Policy/Medical/Billing.
    claim_id: str
    fraud_score: int = 0
    # Derived deterministically from fraud_score in services/fraud.py,
    # not left to the model to self-report.
    fraud_level: FraudLevel = FraudLevel.LOW
    red_flags: list[str] = Field(default_factory=list)
    narrative_mismatch_severity: Literal["none", "minor", "moderate", "major"] | None = None
    duplicate_invoice_suspected: bool = False
    altered_document_suspected: bool = False
    suspicious_timing: bool = False
    inflated_billing_suspected: bool = False
    confidence: float = 0.0
    reasoning: str = ""
    error: str | None = None
    processed_at: datetime
