from datetime import datetime, timezone

from app.core.constants import HistoryStatus
from app.core.logger import logger
from app.graph.state import ClaimState
from app.models.history import HistoryResult
from app.services import history as history_service

STAGE_NAME = "history"


def run(state: ClaimState) -> dict:
    claim = state["claim"]
    medical_result = state.get("medical_result")
    errors: list[str] = []

    if not medical_result or not medical_result.diagnosis:
        # No diagnosis to search on - skip Qdrant entirely (no network call),
        # mirroring Billing's/Fraud's NO_DOCUMENT/NO_DATA short-circuit.
        logger.info(f"[{STAGE_NAME}] no diagnosis for claim {state['claim_id']}, skipping")
        return {
            "workflow_history": [STAGE_NAME],
            "historical_result": None,
            "historical_status": HistoryStatus.NO_DATA,
            "updated_at": datetime.now(timezone.utc),
        }

    try:
        result = history_service.find_similar_claims(claim, medical_result, state.get("billing_result"))
        status = HistoryStatus.FOUND if result.similar_claims else HistoryStatus.NOT_FOUND
        logger.info(
            f"[{STAGE_NAME}] claim {state['claim_id']}: {len(result.similar_claims)} similar claim(s) found"
        )
    except history_service.HistoryServiceError as exc:
        logger.error(f"[{STAGE_NAME}] search failed for claim {state['claim_id']}: {exc}")
        result = HistoryResult(
            claim_id=state["claim_id"],
            error=str(exc),
            processed_at=datetime.now(timezone.utc),
        )
        status = HistoryStatus.FAILED
        errors.append(f"history: {exc}")

    return {
        "workflow_history": [STAGE_NAME],
        "historical_result": result,
        "historical_status": status,
        "errors": errors,
        "updated_at": datetime.now(timezone.utc),
    }
