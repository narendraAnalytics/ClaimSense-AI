from datetime import datetime

from pydantic import BaseModel


class ReportResult(BaseModel):
    claim_id: str
    report_url: str | None = None
    page_count: int = 0
    error: str | None = None
    processed_at: datetime
