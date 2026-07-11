from datetime import datetime

from pydantic import BaseModel, Field


class DiagnosisValidation(BaseModel):
    present: bool
    complete: bool
    consistent_with_treatment: bool
    notes: str = ""


class TreatmentValidation(BaseModel):
    surgery_performed: bool | None = None
    treatment_consistent: bool
    hospitalization_justified: bool | None = None
    notes: str = ""


class MedicalResult(BaseModel):
    document_id: str
    claim_id: str
    diagnosis: str | None = None
    diagnosis_code: str | None = None
    treatment: str | None = None
    procedure: str | None = None
    hospitalization_required: bool | None = None
    # Kept as raw strings, not `date` — OCR'd real-world documents have
    # inconsistent date formats, and one malformed LLM-emitted value would
    # otherwise crash extraction outright at the model boundary.
    admission_date: str | None = None
    discharge_date: str | None = None
    medical_necessity: str | None = None
    clinical_consistency: bool | None = None
    diagnosis_validation: DiagnosisValidation | None = None
    treatment_validation: TreatmentValidation | None = None
    missing_documents: list[str] = Field(default_factory=list)
    validation_status: str | None = None
    confidence: float = 0.0
    reasoning: str = ""
    error: str | None = None
    processed_at: datetime
