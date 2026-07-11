from datetime import datetime

from pydantic import BaseModel, Field


class SimilarClaim(BaseModel):
    claim_id: str
    similarity_score: float
    diagnosis: str | None = None
    claim_type: str | None = None
    matched_on: list[str] = Field(default_factory=list)


class HistoryResult(BaseModel):
    claim_id: str
    similar_claims: list[SimilarClaim] = Field(default_factory=list)
    similarity_score: float = 0.0
    historical_summary: str = ""
    error: str | None = None
    processed_at: datetime
