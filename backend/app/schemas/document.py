from datetime import datetime

from pydantic import BaseModel

from app.core.constants import DocumentType


class DocumentMetadata(BaseModel):
    document_id: str
    claim_id: str
    filename: str
    mime_type: str
    extension: str
    size: int
    document_type: DocumentType
    uploaded_at: datetime
