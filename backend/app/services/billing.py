import json
from datetime import datetime, timezone

from pydantic import ValidationError

from app.agents.billing.prompt import build_messages
from app.core.config import settings
from app.core.logger import logger
from app.models.billing import BillingDeduction, BillingResult
from app.models.claim import Claim
from app.models.document_result import DocumentResult
from app.models.medical import MedicalResult
from app.models.policy import PolicyResult
from app.services.sarvam import SarvamChatError, get_sarvam_chat_client

# Fields the model is allowed to author. document_id/claim_id/processed_at/
# error/payable_amount/non_payable_amount are set programmatically — the
# latter two are deliberately computed in Python from total_billed_amount
# and deductions, not trusted from the model's own arithmetic.
_BILLING_JSON_SCHEMA = {
    "name": "billing_validation",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "total_billed_amount": {"type": ["number", "null"]},
            "room_charges_valid": {"type": ["boolean", "null"]},
            "medicines_valid": {"type": ["boolean", "null"]},
            "procedures_valid": {"type": ["boolean", "null"]},
            "non_payable_items": {"type": "array", "items": {"type": "string"}},
            "deductions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "item": {"type": "string"},
                        "amount": {"type": "number"},
                        "reason": {"type": "string"},
                    },
                    "required": ["item", "amount", "reason"],
                },
            },
            "validation_status": {"type": "string"},
            "confidence": {"type": "number"},
            "reasoning": {"type": "string"},
        },
        "required": [
            "total_billed_amount",
            "room_charges_valid",
            "medicines_valid",
            "procedures_valid",
            "non_payable_items",
            "deductions",
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


class BillingServiceError(Exception):
    pass


def prepare_prompt(
    documents: list[DocumentResult],
    claim: Claim,
    policy_result: PolicyResult | None,
    medical_result: MedicalResult | None,
) -> list[dict]:
    per_doc_budget = max(settings.sarvam_chat_max_input_chars // len(documents), 1000)

    sections = []
    for document in documents:
        markdown = document.markdown or ""
        if len(markdown) > per_doc_budget:
            logger.warning(
                f"[billing] document {document.document_id} markdown truncated from "
                f"{len(markdown)} to {per_doc_budget} chars"
            )
            markdown = markdown[:per_doc_budget]
        sections.append(f"--- {document.document_type.upper()} ---\n{markdown}")

    policy_context = (
        policy_result.reasoning if policy_result and policy_result.reasoning else "No policy analysis available."
    )
    medical_context = (
        medical_result.reasoning
        if medical_result and medical_result.reasoning
        else "No medical validation available."
    )

    return build_messages(
        document_sections="\n\n".join(sections),
        policy_context=policy_context,
        medical_context=medical_context,
    )


def call_sarvam(messages: list[dict]) -> dict:
    client = get_sarvam_chat_client()
    try:
        return client.chat_completion(
            messages=messages,
            response_format={"type": "json_schema", "json_schema": _BILLING_JSON_SCHEMA},
        )
    except SarvamChatError as exc:
        logger.warning(f"[billing] json_schema response_format failed ({exc}), falling back to json_object")
        try:
            return client.chat_completion(messages=messages, response_format={"type": "json_object"})
        except SarvamChatError as fallback_exc:
            raise BillingServiceError(f"Sarvam chat completion failed: {fallback_exc}") from fallback_exc


def validate_response(raw_content: str | None, messages: list[dict]) -> dict:
    if raw_content:
        try:
            return json.loads(raw_content)
        except json.JSONDecodeError:
            pass

    logger.warning(
        f"[billing] response was empty or not valid JSON (raw_content={raw_content!r}), "
        "retrying once with a repair reminder"
    )
    repair_messages = messages + [
        {"role": "assistant", "content": raw_content or ""},
        {"role": "user", "content": _REPAIR_REMINDER},
    ]
    completion = call_sarvam(repair_messages)
    content = completion["choices"][0]["message"]["content"]
    if not content:
        raise BillingServiceError("Sarvam returned an empty response after repair retry")
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise BillingServiceError(f"Sarvam response was not valid JSON after repair retry: {exc}") from exc


def convert_to_model(parsed: dict, documents: list[DocumentResult], claim: Claim) -> BillingResult:
    primary = documents[0]
    deductions_raw = parsed.get("deductions") or []
    total_billed = parsed.get("total_billed_amount")

    deduction_total = sum(d.get("amount", 0.0) for d in deductions_raw)
    payable_amount = None
    if total_billed is not None:
        payable_amount = max(total_billed - deduction_total, 0.0)

    try:
        return BillingResult(
            document_id=primary.document_id,
            claim_id=claim.claim_id,
            total_billed_amount=total_billed,
            payable_amount=payable_amount,
            non_payable_amount=deduction_total if total_billed is not None else None,
            room_charges_valid=parsed.get("room_charges_valid"),
            medicines_valid=parsed.get("medicines_valid"),
            procedures_valid=parsed.get("procedures_valid"),
            non_payable_items=parsed.get("non_payable_items", []),
            deductions=[BillingDeduction(**d) for d in deductions_raw],
            validation_status=parsed.get("validation_status"),
            confidence=parsed.get("confidence", 0.0),
            reasoning=parsed.get("reasoning", ""),
            processed_at=datetime.now(timezone.utc),
        )
    except ValidationError as exc:
        raise BillingServiceError(f"Sarvam response did not match BillingResult schema: {exc}") from exc


def validate_billing(
    documents: list[DocumentResult],
    claim: Claim,
    policy_result: PolicyResult | None,
    medical_result: MedicalResult | None,
) -> BillingResult:
    messages = prepare_prompt(documents, claim, policy_result, medical_result)
    completion = call_sarvam(messages)

    usage = completion.get("usage") or {}
    logger.info(
        f"[billing] claim {claim.claim_id}: sarvam chat completion used "
        f"{usage.get('prompt_tokens')} prompt + {usage.get('completion_tokens')} completion "
        f"= {usage.get('total_tokens')} total tokens"
    )

    raw_content = completion["choices"][0]["message"]["content"]
    parsed = validate_response(raw_content, messages)
    return convert_to_model(parsed, documents, claim)
