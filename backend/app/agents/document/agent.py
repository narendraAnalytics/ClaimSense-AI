from datetime import datetime, timezone

import httpx

from app.core.constants import DocumentStatus
from app.core.logger import logger
from app.graph.state import ClaimState
from app.models.document import Document
from app.models.document_result import DocumentResult
from app.services import parser, storage
from app.services.sarvam import SarvamVisionClient, SarvamVisionError, get_sarvam_client

STAGE_NAME = "document"

# Sarvam Vision's document-intelligence job only accepts PDF or image
# (JPEG/PNG) input — image/webp passes our upload validation but isn't
# accepted here, so it's skipped rather than sent to a job that will fail.
SUPPORTED_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png"}


async def run(state: ClaimState) -> dict:
    documents = state["documents"]

    if not documents:
        logger.info(f"[{STAGE_NAME}] no documents attached for claim {state['claim_id']}, skipping OCR")
        return {
            "workflow_history": [STAGE_NAME],
            "parsed_documents": [],
            "document_status": DocumentStatus.PARSED,
            "document_summary": {"document_count": 0},
            "updated_at": datetime.now(timezone.utc),
        }

    client = get_sarvam_client()
    results = []
    errors: list[str] = []

    for document in documents:
        result = await _extract_one(client, document)
        results.append(result)
        if result.error:
            errors.append(f"{document.filename}: {result.error}")

    succeeded = sum(1 for r in results if r.status == DocumentStatus.PARSED)
    if succeeded == len(results):
        overall_status = DocumentStatus.PARSED
    elif succeeded == 0:
        overall_status = DocumentStatus.FAILED
    else:
        overall_status = DocumentStatus.PARTIAL

    logger.info(
        f"[{STAGE_NAME}] claim {state['claim_id']}: {succeeded}/{len(results)} document(s) parsed "
        f"(status={overall_status.value})"
    )

    return {
        "workflow_history": [STAGE_NAME],
        "parsed_documents": results,
        "document_status": overall_status,
        "document_summary": {
            "document_count": len(results),
            "parsed_count": succeeded,
            "total_pages": sum(r.page_count for r in results),
        },
        "errors": errors,
        "updated_at": datetime.now(timezone.utc),
    }


async def _extract_one(client: SarvamVisionClient, document: Document) -> DocumentResult:
    if document.mime_type not in SUPPORTED_MIME_TYPES:
        message = f"Unsupported mime type '{document.mime_type}' for Sarvam Vision"
        logger.warning(f"[{STAGE_NAME}] {message} (document {document.document_id})")
        return DocumentResult(
            document_id=document.document_id,
            claim_id=document.claim_id,
            document_type=document.document_type.value,
            status=DocumentStatus.FAILED,
            page_count=0,
            pages=[],
            error=message,
            processed_at=datetime.now(timezone.utc),
        )

    try:
        document_bytes = await storage.get_file_bytes(document.storage_id)
        zip_bytes = client.extract_document(
            document_bytes=document_bytes,
            filename=document.filename,
            content_type=document.mime_type,
        )
        return parser.parse_extraction_zip(zip_bytes, document)
    except (SarvamVisionError, parser.DocumentParseError, storage.FileStorageError, httpx.HTTPError) as exc:
        logger.error(f"[{STAGE_NAME}] failed to process document {document.document_id}: {exc}")
        return DocumentResult(
            document_id=document.document_id,
            claim_id=document.claim_id,
            document_type=document.document_type.value,
            status=DocumentStatus.FAILED,
            page_count=0,
            pages=[],
            error=str(exc),
            processed_at=datetime.now(timezone.utc),
        )
