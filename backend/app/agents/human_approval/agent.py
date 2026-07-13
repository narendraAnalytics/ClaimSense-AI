from datetime import datetime, timezone

from langgraph.types import interrupt

from app.core.logger import logger
from app.graph.state import ClaimState

STAGE_NAME = "human_approval"


def run(state: ClaimState) -> dict:
    claim_id = state["claim_id"]
    settlement = state.get("settlement_result")

    decision_input = interrupt(
        {
            "claim_id": claim_id,
            "ai_decision": settlement.approval_status.value if settlement else None,
            "ai_recommended_amount": settlement.recommended_amount if settlement else None,
            "ai_reasoning": settlement.reasoning if settlement else None,
            "fraud_score": state.get("fraud_score"),
        }
    )

    logger.info(
        f"[{STAGE_NAME}] claim {claim_id}: officer decision={decision_input.get('decision')}"
    )

    return {
        "workflow_history": [STAGE_NAME],
        "human_decision": decision_input["decision"],
        "human_amount": decision_input.get("modified_amount"),
        "human_notes": decision_input.get("notes"),
        "human_decided_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
