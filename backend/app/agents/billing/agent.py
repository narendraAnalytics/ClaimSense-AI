from datetime import datetime, timezone

from app.core.constants import BillingValidationStatus, DocumentStatus, DocumentType
from app.core.logger import logger
from app.graph.state import ClaimState
from app.models.billing import BillingResult
from app.services import billing as billing_service

STAGE_NAME = "billing"


def run(state: ClaimState) -> dict:
    documents = state["documents"]
    parsed = state["parsed_documents"]
    claim = state["claim"]

    bill_doc_ids = {d.document_id for d in documents if d.document_type == DocumentType.HOSPITAL_BILL}
    matches = [p for p in parsed if p.document_id in bill_doc_ids and p.status == DocumentStatus.PARSED]

    if not matches:
        logger.info(f"[{STAGE_NAME}] no parsed hospital bill for claim {state['claim_id']}, skipping")
        return {
            "workflow_history": [STAGE_NAME],
            "billing_result": None,
            "billing_status": BillingValidationStatus.NO_DOCUMENT,
            "payable_amount": None,
            "billing_summary": None,
            "updated_at": datetime.now(timezone.utc),
        }

    errors: list[str] = []

    try:
        result = billing_service.validate_billing(
            matches, claim, state.get("policy_result"), state.get("medical_result")
        )
        status = (
            BillingValidationStatus(result.validation_status)
            if result.validation_status
            else BillingValidationStatus.PARTIALLY_PAYABLE
        )
        logger.info(
            f"[{STAGE_NAME}] claim {state['claim_id']}: validation status={status.value} "
            f"payable={result.payable_amount}"
        )
    except (billing_service.BillingServiceError, ValueError) as exc:
        logger.error(f"[{STAGE_NAME}] validation failed for claim {state['claim_id']}: {exc}")
        result = BillingResult(
            document_id=matches[0].document_id,
            claim_id=state["claim_id"],
            confidence=0.0,
            error=str(exc),
            processed_at=datetime.now(timezone.utc),
        )
        status = BillingValidationStatus.FAILED
        errors.append(f"billing: {exc}")

    return {
        "workflow_history": [STAGE_NAME],
        "billing_result": result,
        "billing_status": status,
        "payable_amount": result.payable_amount,
        "billing_summary": result.reasoning or None,
        "errors": errors,
        "updated_at": datetime.now(timezone.utc),
    }
