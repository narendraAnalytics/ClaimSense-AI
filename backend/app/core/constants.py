from enum import Enum

APP_TITLE = "ClaimSense AI Backend"
API_VERSION = "v1"

MAX_UPLOAD_SIZE = 25 * 1024 * 1024  # 25 MB

SUPPORTED_IMAGE_TYPES = ("image/jpeg", "image/png", "image/webp")
SUPPORTED_PDF_TYPES = ("application/pdf",)


class ClaimStatus(str, Enum):
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    SETTLED = "settled"


class DocumentType(str, Enum):
    POLICY = "policy"
    MEDICAL_RECORD = "medical_record"
    BILL = "bill"
    ID_PROOF = "id_proof"
    EVIDENCE_PHOTO = "evidence_photo"
    OTHER = "other"


class FraudLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ReportStatus(str, Enum):
    PENDING = "pending"
    GENERATING = "generating"
    READY = "ready"
    FAILED = "failed"


CLAIM_STATUS = ClaimStatus
DOCUMENT_TYPES = DocumentType
FRAUD_LEVELS = FraudLevel
REPORT_STATUS = ReportStatus
