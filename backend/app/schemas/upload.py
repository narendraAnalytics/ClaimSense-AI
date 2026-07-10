from pydantic import BaseModel

from app.core.constants import DocumentType


class UploadedDocument(BaseModel):
    document_id: str
    filename: str
    content_type: str
    size: int
    document_type: DocumentType
    upload_status: str


class UploadError(BaseModel):
    filename: str
    error: str


class UploadResponse(BaseModel):
    claim_id: str
    uploaded: list[UploadedDocument]
    errors: list[UploadError]
    message: str
