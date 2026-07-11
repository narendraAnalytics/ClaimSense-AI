from datetime import datetime

from pydantic import BaseModel, Field


class BillingDeduction(BaseModel):
    item: str
    amount: float
    reason: str


class BillingResult(BaseModel):
    document_id: str
    claim_id: str
    total_billed_amount: float | None = None
    # payable_amount is computed deterministically in services/billing.py
    # (total_billed_amount - sum(deductions)) rather than trusted from the
    # model's own arithmetic — an auditability choice, not an LLM output.
    payable_amount: float | None = None
    non_payable_amount: float | None = None
    room_charges_valid: bool | None = None
    medicines_valid: bool | None = None
    procedures_valid: bool | None = None
    non_payable_items: list[str] = Field(default_factory=list)
    deductions: list[BillingDeduction] = Field(default_factory=list)
    validation_status: str | None = None
    confidence: float = 0.0
    reasoning: str = ""
    error: str | None = None
    processed_at: datetime
