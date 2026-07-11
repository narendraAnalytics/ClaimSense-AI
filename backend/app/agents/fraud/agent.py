from datetime import datetime, timezone

from app.core.constants import DocumentStatus, FraudAssessmentStatus
from app.core.logger import logger
from app.graph.state import ClaimState
from app.models.fraud import FraudResult
from app.services import fraud as fraud_service

STAGE_NAME = "fraud"


def run(state: ClaimState) -> dict:
    parsed = [p for p in state["parsed_documents"] if p.status == DocumentStatus.PARSED]
    claim = state["claim"]

    # No parsed documents at all means nothing beyond bare claim metadata
    # to reason about — skip without calling Sarvam, mirroring Policy's/
    # Medical's no-document short-circuit (keeps claims with zero uploaded
    # documents network-free, same as the rest of the pipeline).
    if not parsed:
        logger.info(f"[{STAGE_NAME}] no parsed documents for claim {state['claim_id']}, skipping")
        return {
            "workflow_history": [STAGE_NAME],
            "fraud_result": None,
            "fraud_status": FraudAssessmentStatus.NO_DATA,
            "fraud_score": None,
            "updated_at": datetime.now(timezone.utc),
        }

    errors: list[str] = []

    try:
        result = fraud_service.assess_fraud(
            parsed, claim, state.get("medical_result"), state.get("billing_result")
        )
        status = FraudAssessmentStatus.ASSESSED
        logger.info(
            f"[{STAGE_NAME}] claim {state['claim_id']}: fraud_score={result.fraud_score} "
            f"level={result.fraud_level.value}"
        )
    except fraud_service.FraudServiceError as exc:
        logger.error(f"[{STAGE_NAME}] assessment failed for claim {state['claim_id']}: {exc}")
        result = FraudResult(
            claim_id=state["claim_id"],
            confidence=0.0,
            error=str(exc),
            processed_at=datetime.now(timezone.utc),
        )
        status = FraudAssessmentStatus.FAILED
        errors.append(f"fraud: {exc}")

    return {
        "workflow_history": [STAGE_NAME],
        "fraud_result": result,
        "fraud_status": status,
        "fraud_score": result.fraud_score,
        "errors": errors,
        "updated_at": datetime.now(timezone.utc),
    }
