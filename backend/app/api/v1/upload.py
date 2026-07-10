from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.deps import enforce_max_request_size, get_existing_claim
from app.core.constants import ClaimStatus, DocumentType
from app.models.claim import Claim
from app.models.document import Document
from app.schemas.upload import UploadedDocument, UploadError, UploadResponse
from app.services import storage
from app.services.claim_registry import attach_document
from app.services.document_registry import add_document

router = APIRouter(tags=["upload"])


# No caller/ownership check yet — any client that knows a claim_id can
# upload documents to it. `app/core/security.py` is a deliberate placeholder
# until JWT/API-key auth lands in a later phase (see projectfolder.txt Phase
# 4 Step 6); until then, treat this endpoint as unauthenticated by design.
@router.post(
    "/claims/{claim_id}/upload",
    response_model=UploadResponse,
    dependencies=[Depends(enforce_max_request_size)],
)
async def upload_documents(
    files: list[UploadFile] = File(...),
    document_type: DocumentType = Form(DocumentType.OTHER),
    claim: Claim = Depends(get_existing_claim),
) -> UploadResponse:
    uploaded: list[UploadedDocument] = []
    errors: list[UploadError] = []

    for upload_file in files:
        try:
            storage.validate_file(upload_file)
        except storage.FileValidationError as exc:
            errors.append(UploadError(filename=upload_file.filename or "unknown", error=str(exc)))
            continue

        document_id = storage.generate_document_id()
        path = await storage.save_temp_file(upload_file, claim.claim_id, document_id)
        metadata = storage.get_file_metadata(path, upload_file)

        document = Document(
            document_id=document_id,
            claim_id=claim.claim_id,
            filename=metadata["filename"],
            mime_type=metadata["mime_type"],
            extension=metadata["extension"],
            size=metadata["size"],
            document_type=document_type,
            storage_path=str(path),
            uploaded_at=metadata["uploaded_at"],
        )
        add_document(document)
        attach_document(claim.claim_id, document.document_id)

        uploaded.append(
            UploadedDocument(
                document_id=document.document_id,
                filename=document.filename,
                content_type=document.mime_type,
                size=document.size,
                document_type=document.document_type,
                upload_status=document.upload_status,
            )
        )

    if uploaded:
        claim.status = ClaimStatus.DOCUMENTS_RECEIVED
        claim.updated_at = datetime.now(timezone.utc)

    return UploadResponse(
        claim_id=claim.claim_id,
        uploaded=uploaded,
        errors=errors,
        message=f"{len(uploaded)} document(s) uploaded, {len(errors)} error(s)",
    )
