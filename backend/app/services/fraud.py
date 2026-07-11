import json
from datetime import datetime, timezone

from pydantic import ValidationError

from app.agents.fraud.prompt import build_messages
from app.core.config import settings
from app.core.constants import DocumentType, FraudLevel
from app.core.logger import logger
from app.models.billing import BillingResult
from app.models.claim import Claim
from app.models.document_result import DocumentResult
from app.models.fraud import FraudResult
from app.models.medical import MedicalResult
from app.services.sarvam import SarvamChatError, get_sarvam_chat_client

# Fields the model is allowed to author. claim_id/processed_at/error/
# fraud_level are set programmatically — fraud_level is deliberately
# derived from fraud_score in Python, not trusted from the model.
_FRAUD_JSON_SCHEMA = {
    "name": "fraud_assessment",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "fraud_score": {"type": "integer"},
            "red_flags": {"type": "array", "items": {"type": "string"}},
            "narrative_medical_consistency": {"type": ["boolean", "null"]},
            "duplicate_invoice_suspected": {"type": "boolean"},
            "altered_document_suspected": {"type": "boolean"},
            "suspicious_timing": {"type": "boolean"},
            "inflated_billing_suspected": {"type": "boolean"},
            "confidence": {"type": "number"},
            "reasoning": {"type": "string"},
        },
        "required": [
            "fraud_score",
            "red_flags",
            "narrative_medical_consistency",
            "duplicate_invoice_suspected",
            "altered_document_suspected",
            "suspicious_timing",
            "inflated_billing_suspected",
            "confidence",
            "reasoning",
        ],
    },
}

_REPAIR_REMINDER = (
    "Your previous response was not valid JSON matching the required schema. "
    "Return ONLY a single valid JSON object, no markdown fences, no commentary."
)

_SUPPORTING_DOCUMENT_TYPES = {DocumentType.HOSPITAL_BILL.value, DocumentType.DISCHARGE_SUMMARY.value}


class FraudServiceError(Exception):
    pass


def _fraud_level(score: int) -> FraudLevel:
    if score >= 70:
        return FraudLevel.HIGH
    if score >= 30:
        return FraudLevel.MEDIUM
    return FraudLevel.LOW


def prepare_prompt(
    documents: list[DocumentResult],
    claim: Claim,
    medical_result: MedicalResult | None,
    billing_result: BillingResult | None,
) -> list[dict]:
    supporting = [d for d in documents if d.document_type in _SUPPORTING_DOCUMENT_TYPES]
    if not supporting:
        supporting = documents

    per_doc_budget = max(settings.sarvam_chat_max_input_chars // max(len(supporting), 1), 1000)

    sections = []
    for document in supporting:
        markdown = document.markdown or ""
        if len(markdown) > per_doc_budget:
            logger.warning(
                f"[fraud] document {document.document_id} markdown truncated from "
                f"{len(markdown)} to {per_doc_budget} chars"
            )
            markdown = markdown[:per_doc_budget]
        sections.append(f"--- {document.document_type.upper()} ---\n{markdown}")

    claim_narrative = (
        f"Claim type: {claim.claim_type}. Incident date: {claim.incident_date}. "
        f"Description: {claim.incident_description}"
    )
    medical_context = (
        medical_result.reasoning
        if medical_result and medical_result.reasoning
        else "No medical validation available."
    )
    billing_context = (
        billing_result.reasoning if billing_result and billing_result.reasoning else "No billing validation available."
    )

    return build_messages(
        document_sections="\n\n".join(sections) if sections else "No supporting documents available.",
        claim_narrative=claim_narrative,
        medical_context=medical_context,
        billing_context=billing_context,
    )


def call_sarvam(messages: list[dict]) -> dict:
    client = get_sarvam_chat_client()
    try:
        return client.chat_completion(
            messages=messages,
            response_format={"type": "json_schema", "json_schema": _FRAUD_JSON_SCHEMA},
        )
    except SarvamChatError as exc:
        logger.warning(f"[fraud] json_schema response_format failed ({exc}), falling back to json_object")
        try:
            return client.chat_completion(messages=messages, response_format={"type": "json_object"})
        except SarvamChatError as fallback_exc:
            raise FraudServiceError(f"Sarvam chat completion failed: {fallback_exc}") from fallback_exc


def validate_response(raw_content: str | None, messages: list[dict]) -> dict:
    if raw_content:
        try:
            return json.loads(raw_content)
        except json.JSONDecodeError:
            pass

    logger.warning(
        f"[fraud] response was empty or not valid JSON (raw_content={raw_content!r}), "
        "retrying once with a repair reminder"
    )
    repair_messages = messages + [
        {"role": "assistant", "content": raw_content or ""},
        {"role": "user", "content": _REPAIR_REMINDER},
    ]
    completion = call_sarvam(repair_messages)
    content = completion["choices"][0]["message"]["content"]
    if not content:
        raise FraudServiceError("Sarvam returned an empty response after repair retry")
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise FraudServiceError(f"Sarvam response was not valid JSON after repair retry: {exc}") from exc


def convert_to_model(parsed: dict, claim: Claim) -> FraudResult:
    score = int(parsed.get("fraud_score", 0))
    try:
        return FraudResult(
            claim_id=claim.claim_id,
            fraud_score=score,
            fraud_level=_fraud_level(score),
            red_flags=parsed.get("red_flags", []),
            narrative_medical_consistency=parsed.get("narrative_medical_consistency"),
            duplicate_invoice_suspected=parsed.get("duplicate_invoice_suspected", False),
            altered_document_suspected=parsed.get("altered_document_suspected", False),
            suspicious_timing=parsed.get("suspicious_timing", False),
            inflated_billing_suspected=parsed.get("inflated_billing_suspected", False),
            confidence=parsed.get("confidence", 0.0),
            reasoning=parsed.get("reasoning", ""),
            processed_at=datetime.now(timezone.utc),
        )
    except ValidationError as exc:
        raise FraudServiceError(f"Sarvam response did not match FraudResult schema: {exc}") from exc


def assess_fraud(
    documents: list[DocumentResult],
    claim: Claim,
    medical_result: MedicalResult | None,
    billing_result: BillingResult | None,
) -> FraudResult:
    messages = prepare_prompt(documents, claim, medical_result, billing_result)
    completion = call_sarvam(messages)

    usage = completion.get("usage") or {}
    logger.info(
        f"[fraud] claim {claim.claim_id}: sarvam chat completion used "
        f"{usage.get('prompt_tokens')} prompt + {usage.get('completion_tokens')} completion "
        f"= {usage.get('total_tokens')} total tokens"
    )

    raw_content = completion["choices"][0]["message"]["content"]
    parsed = validate_response(raw_content, messages)
    return convert_to_model(parsed, claim)
