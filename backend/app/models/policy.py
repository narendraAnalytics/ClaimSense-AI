from datetime import datetime

from pydantic import BaseModel, Field


class PolicyResult(BaseModel):
    document_id: str
    claim_id: str
    is_policy_document: bool
    policy_number: str | None = None
    policy_holder: str | None = None
    insurance_company: str | None = None
    policy_type: str | None = None
    coverage_type: str | None = None
    # Kept as raw strings, not `date` — OCR'd real-world documents have
    # inconsistent date formats, and one malformed LLM-emitted value would
    # otherwise crash extraction outright at the model boundary.
    effective_date: str | None = None
    expiry_date: str | None = None
    sum_insured: float | None = None
    waiting_period: str | None = None
    deductible: float | None = None
    copayment: str | None = None
    exclusions: list[str] = Field(default_factory=list)
    covered: bool | None = None
    confidence: float = 0.0
    reasoning: str = ""
    error: str | None = None
    processed_at: datetime
