from datetime import date, datetime

from pydantic import BaseModel, Field

from app.core.constants import ClaimStatus


class Claim(BaseModel):
    claim_id: str
    policy_number: str
    claimant_name: str
    claim_type: str
    incident_date: date
    incident_description: str
    status: ClaimStatus = ClaimStatus.NEW
    documents: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
