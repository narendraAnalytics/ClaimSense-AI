from datetime import datetime, timezone

from app.core.constants import DocumentStatus, DocumentType, PolicyExtractionStatus
from app.core.logger import logger
from app.graph.state import ClaimState
from app.models.policy import PolicyResult
from app.services import policy as policy_service

STAGE_NAME = "policy"


def run(state: ClaimState) -> dict:
    documents = state["documents"]
    parsed = state["parsed_documents"]
    claim = state["claim"]

    policy_doc_ids = {d.document_id for d in documents if d.document_type == DocumentType.POLICY}
    matches = [p for p in parsed if p.document_id in policy_doc_ids and p.status == DocumentStatus.PARSED]

    if not matches:
        logger.info(f"[{STAGE_NAME}] no parsed policy document for claim {state['claim_id']}, skipping")
        return {
            "workflow_history": [STAGE_NAME],
            "policy_result": None,
            "policy_status": PolicyExtractionStatus.NO_DOCUMENT,
            "coverage_summary": None,
            "coverage_decision": None,
            "updated_at": datetime.now(timezone.utc),
        }

    if len(matches) > 1:
        logger.warning(
            f"[{STAGE_NAME}] multiple policy documents found for claim {state['claim_id']}, using first"
        )

    document = matches[0]
    errors: list[str] = []

    try:
        result = policy_service.extract_policy(document, claim)
        status = (
            PolicyExtractionStatus.EXTRACTED
            if result.is_policy_document
            else PolicyExtractionStatus.NOT_A_POLICY
        )
        logger.info(
            f"[{STAGE_NAME}] claim {state['claim_id']}: extraction status={status.value} "
            f"confidence={result.confidence}"
        )
    except policy_service.PolicyServiceError as exc:
        logger.error(f"[{STAGE_NAME}] extraction failed for claim {state['claim_id']}: {exc}")
        result = PolicyResult(
            document_id=document.document_id,
            claim_id=state["claim_id"],
            is_policy_document=False,
            confidence=0.0,
            error=str(exc),
            processed_at=datetime.now(timezone.utc),
        )
        status = PolicyExtractionStatus.FAILED
        errors.append(f"policy: {exc}")

    return {
        "workflow_history": [STAGE_NAME],
        "policy_result": result,
        "policy_status": status,
        "coverage_summary": result.reasoning or None,
        "coverage_decision": result.covered,
        "errors": errors,
        "updated_at": datetime.now(timezone.utc),
    }
