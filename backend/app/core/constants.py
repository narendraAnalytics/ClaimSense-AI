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
    AWAITING_APPROVAL = "awaiting_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    FAILED = "failed"


class DocumentType(str, Enum):
    POLICY = "policy"
    CLAIM_FORM = "claim_form"
    HOSPITAL_BILL = "hospital_bill"
    DISCHARGE_SUMMARY = "discharge_summary"
    ADMISSION_NOTE = "admission_note"
    LAB_REPORT = "lab_report"
    DIAGNOSTIC_REPORT = "diagnostic_report"
    PRESCRIPTION = "prescription"
    MEDICAL_CERTIFICATE = "medical_certificate"
    ID_PROOF = "id_proof"
    FIR = "fir"
    MLC = "mlc"
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


class BillingValidationStatus(str, Enum):
    VALIDATED = "validated"
    PARTIALLY_PAYABLE = "partially_payable"
    NOT_PAYABLE = "not_payable"
    NO_DOCUMENT = "no_document"
    FAILED = "failed"


class FraudAssessmentStatus(str, Enum):
    ASSESSED = "assessed"
    NO_DATA = "no_data"
    FAILED = "failed"


class HistoryStatus(str, Enum):
    FOUND = "found"
    NOT_FOUND = "not_found"
    NO_DATA = "no_data"
    FAILED = "failed"


class SettlementDecision(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    NEED_REVIEW = "need_review"


CLAIM_STATUS = ClaimStatus
DOCUMENT_TYPES = DocumentType
DOCUMENT_STATUS = DocumentStatus
FRAUD_LEVELS = FraudLevel
REPORT_STATUS = ReportStatus
