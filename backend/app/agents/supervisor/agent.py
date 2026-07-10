from datetime import datetime, timezone

from app.core.constants import ClaimStatus
from app.core.logger import logger
from app.graph.state import ClaimState


def decide_next_step(state: ClaimState) -> dict:
    if state["documents"]:
        logger.info(
            f"Claim {state['claim_id']} has {len(state['documents'])} document(s) attached"
        )
    else:
        logger.info(f"Claim {state['claim_id']} has no documents attached yet")

    return {
        "current_agent": "supervisor",
        "next_agent": "policy",
        "status": ClaimStatus.PROCESSING,
        "workflow_history": ["supervisor"],
        "updated_at": datetime.now(timezone.utc),
    }
