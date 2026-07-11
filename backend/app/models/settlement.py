from datetime import datetime

from pydantic import BaseModel, Field

from app.core.constants import SettlementDecision


class SettlementResult(BaseModel):
    claim_id: str
    approval_status: SettlementDecision
    recommended_amount: float | None = None
    confidence: float = 0.0
    reasoning: str = ""
    contributing_factors: list[str] = Field(default_factory=list)
    error: str | None = None
    processed_at: datetime
