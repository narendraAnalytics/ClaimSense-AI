from datetime import datetime

from pydantic import BaseModel, Field

from app.core.constants import SettlementDecision


class SettlementResult(BaseModel):
    claim_id: str
    approval_status: SettlementDecision
    recommended_amount: float | None = None
    # The billing-validated payable amount after deductible/copayment but
    # BEFORE any policy sum-insured cap is applied — preserved separately so
    # a capped recommendation is auditable (what billing actually supported
    # vs. what the policy will actually pay), not silently overwritten.
    billing_validated_amount: float | None = None
    confidence: float = 0.0
    reasoning: str = ""
    contributing_factors: list[str] = Field(default_factory=list)
    error: str | None = None
    processed_at: datetime
