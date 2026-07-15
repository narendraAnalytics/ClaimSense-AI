from datetime import date, datetime

from app.core.constants import ClaimStatus, DocumentType
from app.models.claim import Claim
from app.models.document import Document
from app.services.convex_client import convex_mutation, convex_query


def _args(**kwargs):
    # Convex's v.optional(...) validator expects the key to be absent, not
    # explicitly null — same convention as checkpointer.py's _args() helper.
    return {k: v for k, v in kwargs.items() if v is not None}


async def save_claim(claim: Claim) -> None:
    await convex_mutation(
        "backendRegistry:putClaim",
        {
            "claimId": claim.claim_id,
            "policyNumber": claim.policy_number,
            "claimantName": claim.claimant_name,
            "claimType": claim.claim_type,
            "incidentDate": claim.incident_date.isoformat(),
            "incidentDescription": claim.incident_description,
            "status": claim.status.value,
        },
    )


async def load_claim(claim_id: str) -> Claim | None:
    row = await convex_query("backendRegistry:getClaimByClaimId", {"claimId": claim_id})
    if row is None:
        return None
    return Claim(
        claim_id=row["claimId"],
        policy_number=row["policyNumber"],
        claimant_name=row["claimantName"],
        claim_type=row["claimType"],
        incident_date=date.fromisoformat(row["incidentDate"]),
        incident_description=row["incidentDescription"],
        status=ClaimStatus(row["status"]),
        documents=row["documentIds"],
        created_at=datetime.fromtimestamp(row["createdAt"] / 1000),
        updated_at=datetime.fromtimestamp(row["updatedAt"] / 1000),
    )


async def claim_exists(claim_id: str) -> bool:
    return await convex_query("backendRegistry:claimExists", {"claimId": claim_id})


async def update_claim_status(claim_id: str, status: ClaimStatus) -> None:
    await convex_mutation("backendRegistry:updateClaimStatus", {"claimId": claim_id, "status": status.value})


async def set_report_storage_id(claim_id: str, storage_id: str) -> None:
    await convex_mutation(
        "backendRegistry:setReportStorageId", {"claimId": claim_id, "storageId": storage_id}
    )


async def get_report_storage_id(claim_id: str) -> str | None:
    return await convex_query("backendRegistry:getReportStorageId", {"claimId": claim_id})


async def attach_document(claim_id: str, document_id: str) -> None:
    await convex_mutation("backendRegistry:attachDocument", {"claimId": claim_id, "documentId": document_id})


async def save_document(document: Document) -> None:
    await convex_mutation(
        "backendRegistry:putDocument",
        {
            "documentId": document.document_id,
            "claimId": document.claim_id,
            "filename": document.filename,
            "mimeType": document.mime_type,
            "extension": document.extension,
            "size": document.size,
            "documentType": document.document_type.value,
            "storageId": document.storage_id,
            "uploadStatus": document.upload_status,
        },
    )


def _document_from_row(row: dict) -> Document:
    return Document(
        document_id=row["documentId"],
        claim_id=row["claimId"],
        filename=row["filename"],
        mime_type=row["mimeType"],
        extension=row["extension"],
        size=row["size"],
        document_type=DocumentType(row["documentType"]),
        storage_id=row["storageId"],
        uploaded_at=datetime.fromtimestamp(row["uploadedAt"] / 1000),
        upload_status=row["uploadStatus"],
    )


async def load_document(document_id: str) -> Document | None:
    row = await convex_query("backendRegistry:getDocument", {"documentId": document_id})
    if row is None:
        return None
    return _document_from_row(row)


async def list_documents_for_claim(claim_id: str) -> list[Document]:
    rows = await convex_query("backendRegistry:listDocumentsForClaim", {"claimId": claim_id})
    return [_document_from_row(row) for row in rows]
