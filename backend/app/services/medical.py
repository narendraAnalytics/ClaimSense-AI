import json
from datetime import datetime, timezone

from pydantic import ValidationError

from app.agents.medical.prompt import build_messages
from app.core.config import settings
from app.core.constants import DocumentType
from app.core.logger import logger
from app.models.claim import Claim
from app.models.document_result import DocumentResult
from app.models.medical import MedicalResult
from app.models.policy import PolicyResult
from app.services.sarvam import SarvamChatError, get_sarvam_chat_client

_DIAGNOSIS_VALIDATION_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "present": {"type": "boolean"},
        "complete": {"type": "boolean"},
        "consistent_with_treatment": {"type": "boolean"},
        "notes": {"type": "string"},
    },
    "required": ["present", "complete", "consistent_with_treatment", "notes"],
}

_TREATMENT_VALIDATION_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "surgery_performed": {"type": ["boolean", "null"]},
        "treatment_consistent": {"type": "boolean"},
        "hospitalization_justified": {"type": ["boolean", "null"]},
        "notes": {"type": "string"},
    },
    "required": [
        "surgery_performed",
        "treatment_consistent",
        "hospitalization_justified",
        "notes",
    ],
}

# Fields the model is allowed to author. document_id/claim_id/processed_at/
# error are set programmatically and must never be invented by the LLM.
_MEDICAL_JSON_SCHEMA = {
    "name": "medical_validation",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "diagnosis": {"type": ["string", "null"]},
            "diagnosis_code": {"type": ["string", "null"]},
            "treatment": {"type": ["string", "null"]},
            "procedure": {"type": ["string", "null"]},
            "hospitalization_required": {"type": ["boolean", "null"]},
            "admission_date": {"type": ["string", "null"]},
            "discharge_date": {"type": ["string", "null"]},
            "medical_necessity": {"type": ["string", "null"]},
            "clinical_consistency": {"type": ["boolean", "null"]},
            "diagnosis_validation": _DIAGNOSIS_VALIDATION_SCHEMA,
            "treatment_validation": _TREATMENT_VALIDATION_SCHEMA,
            "missing_documents": {"type": "array", "items": {"type": "string"}},
            "validation_status": {"type": "string"},
            "confidence": {"type": "number"},
            "reasoning": {"type": "string"},
        },
        "required": [
            "diagnosis",
            "diagnosis_code",
            "treatment",
            "procedure",
            "hospitalization_required",
            "admission_date",
            "discharge_date",
            "medical_necessity",
            "clinical_consistency",
            "diagnosis_validation",
            "treatment_validation",
            "missing_documents",
            "validation_status",
            "confidence",
            "reasoning",
        ],
    },
}

_REPAIR_REMINDER = (
    "Your previous response was not valid JSON matching the required schema. "
    "Return ONLY a single valid JSON object, no markdown fences, no commentary."
)

# Primary document used for MedicalResult.document_id, in priority order —
# the discharge summary is the most authoritative single source of truth
# for the clinical narrative when multiple documents are present.
_PRIMARY_DOCUMENT_PRIORITY = [
    DocumentType.DISCHARGE_SUMMARY.value,
    DocumentType.MEDICAL_CERTIFICATE.value,
    DocumentType.LAB_REPORT.value,
    DocumentType.PRESCRIPTION.value,
]


class MedicalServiceError(Exception):
    pass


def _primary_document(documents: list[DocumentResult]) -> DocumentResult:
    by_type = {d.document_type: d for d in documents}
    for doc_type in _PRIMARY_DOCUMENT_PRIORITY:
        if doc_type in by_type:
            return by_type[doc_type]
    return documents[0]


def prepare_prompt(
    documents: list[DocumentResult], claim: Claim, policy_result: PolicyResult | None
) -> list[dict]:
    per_doc_budget = max(settings.sarvam_chat_max_input_chars // len(documents), 1000)

    sections = []
    for document in documents:
        markdown = document.markdown or ""
        if len(markdown) > per_doc_budget:
            logger.warning(
                f"[medical] document {document.document_id} ({document.document_type}) markdown "
                f"truncated from {len(markdown)} to {per_doc_budget} chars"
            )
            markdown = markdown[:per_doc_budget]
        sections.append(f"--- {document.document_type.upper()} ---\n{markdown}")

    policy_context = (
        policy_result.reasoning
        if policy_result and policy_result.reasoning
        else "No policy analysis available."
    )

    return build_messages(
        document_sections="\n\n".join(sections),
        policy_context=policy_context,
    )


def call_sarvam(messages: list[dict]) -> dict:
    client = get_sarvam_chat_client()
    try:
        return client.chat_completion(
            messages=messages,
            response_format={"type": "json_schema", "json_schema": _MEDICAL_JSON_SCHEMA},
        )
    except SarvamChatError as exc:
        logger.warning(f"[medical] json_schema response_format failed ({exc}), falling back to json_object")
        try:
            return client.chat_completion(messages=messages, response_format={"type": "json_object"})
        except SarvamChatError as fallback_exc:
            raise MedicalServiceError(f"Sarvam chat completion failed: {fallback_exc}") from fallback_exc


def validate_response(raw_content: str | None, messages: list[dict]) -> dict:
    if raw_content:
        try:
            return json.loads(raw_content)
        except json.JSONDecodeError:
            pass

    logger.warning(
        f"[medical] response was empty or not valid JSON (raw_content={raw_content!r}), "
        "retrying once with a repair reminder"
    )
    repair_messages = messages + [
        {"role": "assistant", "content": raw_content or ""},
        {"role": "user", "content": _REPAIR_REMINDER},
    ]
    completion = call_sarvam(repair_messages)
    content = completion["choices"][0]["message"]["content"]
    if not content:
        raise MedicalServiceError("Sarvam returned an empty response after repair retry")
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise MedicalServiceError(f"Sarvam response was not valid JSON after repair retry: {exc}") from exc


def convert_to_model(parsed: dict, documents: list[DocumentResult], claim: Claim) -> MedicalResult:
    primary = _primary_document(documents)
    try:
        return MedicalResult(
            **parsed,
            document_id=primary.document_id,
            claim_id=claim.claim_id,
            processed_at=datetime.now(timezone.utc),
        )
    except ValidationError as exc:
        raise MedicalServiceError(f"Sarvam response did not match MedicalResult schema: {exc}") from exc


def validate_medical(
    documents: list[DocumentResult], claim: Claim, policy_result: PolicyResult | None
) -> MedicalResult:
    messages = prepare_prompt(documents, claim, policy_result)
    completion = call_sarvam(messages)

    usage = completion.get("usage") or {}
    logger.info(
        f"[medical] claim {claim.claim_id}: sarvam chat completion used "
        f"{usage.get('prompt_tokens')} prompt + {usage.get('completion_tokens')} completion "
        f"= {usage.get('total_tokens')} total tokens"
    )

    raw_content = completion["choices"][0]["message"]["content"]
    parsed = validate_response(raw_content, messages)
    return convert_to_model(parsed, documents, claim)
