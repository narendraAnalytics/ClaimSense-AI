from datetime import datetime, timezone

from app.core.constants import DocumentStatus, DocumentType, MedicalValidationStatus
from app.core.logger import logger
from app.graph.state import ClaimState
from app.models.medical import MedicalResult
from app.services import medical as medical_service

STAGE_NAME = "medical"

_MEDICAL_DOCUMENT_TYPES = {
    DocumentType.DISCHARGE_SUMMARY,
    DocumentType.LAB_REPORT,
    DocumentType.PRESCRIPTION,
    DocumentType.MEDICAL_CERTIFICATE,
}


def run(state: ClaimState) -> dict:
    documents = state["documents"]
    parsed = state["parsed_documents"]
    claim = state["claim"]

    medical_doc_ids = {d.document_id for d in documents if d.document_type in _MEDICAL_DOCUMENT_TYPES}
    matches = [p for p in parsed if p.document_id in medical_doc_ids and p.status == DocumentStatus.PARSED]

    if not matches:
        logger.info(f"[{STAGE_NAME}] no parsed medical documents for claim {state['claim_id']}, skipping")
        return {
            "workflow_history": [STAGE_NAME],
            "medical_result": None,
            "medical_status": MedicalValidationStatus.NO_DOCUMENT,
            "medical_summary": None,
            "medical_decision": None,
            "updated_at": datetime.now(timezone.utc),
        }

    errors: list[str] = []

    try:
        result = medical_service.validate_medical(matches, claim, state.get("policy_result"))
        status = MedicalValidationStatus(result.validation_status) if result.validation_status else (
            MedicalValidationStatus.VALIDATED
            if result.clinical_consistency
            else MedicalValidationStatus.INCONSISTENT
        )
        logger.info(
            f"[{STAGE_NAME}] claim {state['claim_id']}: validation status={status.value} "
            f"confidence={result.confidence}"
        )
    except (medical_service.MedicalServiceError, ValueError) as exc:
        logger.error(f"[{STAGE_NAME}] validation failed for claim {state['claim_id']}: {exc}")
        result = MedicalResult(
            document_id=matches[0].document_id,
            claim_id=state["claim_id"],
            confidence=0.0,
            error=str(exc),
            processed_at=datetime.now(timezone.utc),
        )
        status = MedicalValidationStatus.FAILED
        errors.append(f"medical: {exc}")

    return {
        "workflow_history": [STAGE_NAME],
        "medical_result": result,
        "medical_status": status,
        "medical_summary": result.reasoning or None,
        "medical_decision": result.clinical_consistency,
        "errors": errors,
        "updated_at": datetime.now(timezone.utc),
    }
