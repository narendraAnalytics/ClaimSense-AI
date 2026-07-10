import operator
from datetime import datetime
from typing import Annotated

from typing_extensions import TypedDict

from app.core.constants import ClaimStatus
from app.core.types import ClaimID
from app.models.claim import Claim
from app.models.document import Document


class ClaimState(TypedDict):
    claim_id: ClaimID
    claim: Claim
    status: ClaimStatus
    documents: list[Document]
    current_agent: str | None
    next_agent: str | None
    messages: Annotated[list[str], operator.add]
    errors: Annotated[list[str], operator.add]
    metadata: dict
    workflow_history: Annotated[list[str], operator.add]
    started_at: datetime
    updated_at: datetime
