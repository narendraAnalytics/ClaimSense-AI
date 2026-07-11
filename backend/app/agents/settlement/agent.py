from datetime import datetime, timezone

from app.core.constants import SettlementDecision
from app.core.logger import logger
from app.graph.state import ClaimState
from app.models.settlement import SettlementResult
from app.services import settlement as settlement_service

STAGE_NAME = "settlement"


def run(state: ClaimState) -> dict:
    claim_id = state["claim_id"]
    errors: list[str] = []

    try:
        result = settlement_service.recommend_settlement(
            claim_id,
            state.get("policy_result"),
            state.get("medical_result"),
            state.get("billing_result"),
            state.get("fraud_result"),
        )
        logger.info(
            f"[{STAGE_NAME}] claim {claim_id}: decision={result.approval_status.value} "
            f"amount={result.recommended_amount}"
        )
    except Exception as exc:  # aggregation over already-validated state; guard against the unexpected anyway
        logger.error(f"[{STAGE_NAME}] recommendation failed for claim {claim_id}: {exc}")
        result = SettlementResult(
            claim_id=claim_id,
            approval_status=SettlementDecision.NEED_REVIEW,
            confidence=0.0,
            error=str(exc),
            processed_at=datetime.now(timezone.utc),
        )
        errors.append(f"settlement: {exc}")

    return {
        "workflow_history": [STAGE_NAME],
        "settlement_result": result,
        "settlement_status": result.approval_status,
        "recommended_amount": result.recommended_amount,
        "errors": errors,
        "updated_at": datetime.now(timezone.utc),
    }
