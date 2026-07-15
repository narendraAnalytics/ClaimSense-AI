from datetime import datetime

from pydantic import BaseModel

from app.core.constants import DocumentType


class Document(BaseModel):
    document_id: str
    claim_id: str
    filename: str
    mime_type: str
    extension: str
    size: int
    document_type: DocumentType
    storage_id: str
    uploaded_at: datetime
    upload_status: str = "stored"
