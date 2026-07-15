from datetime import datetime, timezone

from app.core.constants import ReportStatus
from app.core.logger import logger
from app.graph.state import ClaimState
from app.models.report import ReportResult
from app.services import report_generator

STAGE_NAME = "report"


async def run(state: ClaimState) -> dict:
    claim_id = state["claim_id"]
    errors: list[str] = []

    try:
        result = await report_generator.generate_report(state)
        status = ReportStatus.READY
        logger.info(f"[{STAGE_NAME}] claim {claim_id}: report generated at {result.report_url}")
    except report_generator.ReportGenerationError as exc:
        logger.error(f"[{STAGE_NAME}] generation failed for claim {claim_id}: {exc}")
        result = ReportResult(
            claim_id=claim_id,
            error=str(exc),
            processed_at=datetime.now(timezone.utc),
        )
        status = ReportStatus.FAILED
        errors.append(f"report: {exc}")

    return {
        "workflow_history": [STAGE_NAME],
        "report_result": result,
        "report_status": status,
        "report_url": result.report_url,
        "errors": errors,
        "updated_at": datetime.now(timezone.utc),
    }
