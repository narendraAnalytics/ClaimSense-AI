from enum import Enum

APP_TITLE = "ClaimSense AI Backend"
API_VERSION = "v1"

MAX_UPLOAD_SIZE = 25 * 1024 * 1024  # 25 MB

SUPPORTED_IMAGE_TYPES = ("image/jpeg", "image/png", "image/webp")
SUPPORTED_PDF_TYPES = ("application/pdf",)


class ClaimStatus(str, Enum):
    NEW = "new"
    UPLOADING = "uploading"
    DOCUMENTS_RECEIVED = "documents_received"
    VALIDATING = "validating"
    PROCESSING = "processing"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    FAILED = "failed"


class DocumentType(str, Enum):
    POLICY = "policy"
    HOSPITAL_BILL = "hospital_bill"
    DISCHARGE_SUMMARY = "discharge_summary"
    LAB_REPORT = "lab_report"
    PRESCRIPTION = "prescription"
    MEDICAL_CERTIFICATE = "medical_certificate"
    FIR = "fir"
    ACCIDENT_REPORT = "accident_report"
    PHOTO = "photo"
    VIDEO = "video"
    OTHER = "other"


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    PARSED = "parsed"
    PARTIAL = "partial"
    FAILED = "failed"


class PolicyExtractionStatus(str, Enum):
    EXTRACTED = "extracted"
    NOT_A_POLICY = "not_a_policy"
    NO_DOCUMENT = "no_document"
    FAILED = "failed"


class MedicalValidationStatus(str, Enum):
    VALIDATED = "validated"
    INCONSISTENT = "inconsistent"
    INSUFFICIENT_DOCUMENTATION = "insufficient_documentation"
    NO_DOCUMENT = "no_document"
    FAILED = "failed"


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
DOCUMENT_STATUS = DocumentStatus
FRAUD_LEVELS = FraudLevel
REPORT_STATUS = ReportStatus
