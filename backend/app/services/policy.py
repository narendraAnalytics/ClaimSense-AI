import json
from datetime import datetime, timezone

from pydantic import ValidationError

from app.agents.policy.prompt import build_messages
from app.core.config import settings
from app.core.logger import logger
from app.models.claim import Claim
from app.models.document_result import DocumentResult
from app.models.policy import PolicyResult
from app.services.sarvam import SarvamChatError, get_sarvam_chat_client

# Fields the model is allowed to author. document_id/claim_id/processed_at/
# error are set programmatically and must never be invented by the LLM.
_POLICY_JSON_SCHEMA = {
    "name": "policy_extraction",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "is_policy_document": {"type": "boolean"},
            "policy_number": {"type": ["string", "null"]},
            "policy_holder": {"type": ["string", "null"]},
            "insurance_company": {"type": ["string", "null"]},
            "policy_type": {"type": ["string", "null"]},
            "coverage_type": {"type": ["string", "null"]},
            "effective_date": {"type": ["string", "null"]},
            "expiry_date": {"type": ["string", "null"]},
            "sum_insured": {"type": ["number", "null"]},
            "waiting_period": {"type": ["string", "null"]},
            "deductible": {"type": ["number", "null"]},
            "copayment": {"type": ["string", "null"]},
            "exclusions": {"type": "array", "items": {"type": "string"}},
            "covered": {"type": ["boolean", "null"]},
            "confidence": {"type": "number"},
            "reasoning": {"type": "string"},
        },
        "required": [
            "is_policy_document",
            "policy_number",
            "policy_holder",
            "insurance_company",
            "policy_type",
            "coverage_type",
            "effective_date",
            "expiry_date",
            "sum_insured",
            "waiting_period",
            "deductible",
            "copayment",
            "exclusions",
            "covered",
            "confidence",
            "reasoning",
        ],
    },
}

_REPAIR_REMINDER = (
    "Your previous response was not valid JSON matching the required schema. "
    "Return ONLY a single valid JSON object, no markdown fences, no commentary."
)


class PolicyServiceError(Exception):
    pass


def prepare_prompt(document: DocumentResult, claim: Claim) -> list[dict]:
    markdown = document.markdown or ""
    if len(markdown) > settings.sarvam_chat_max_input_chars:
        logger.warning(
            f"[policy] document {document.document_id} markdown truncated from "
            f"{len(markdown)} to {settings.sarvam_chat_max_input_chars} chars"
        )
        markdown = markdown[: settings.sarvam_chat_max_input_chars]
    return build_messages(document_markdown=markdown, claim_policy_number=claim.policy_number)


def call_sarvam(messages: list[dict]) -> dict:
    client = get_sarvam_chat_client()
    try:
        return client.chat_completion(
            messages=messages,
            response_format={"type": "json_schema", "json_schema": _POLICY_JSON_SCHEMA},
        )
    except SarvamChatError as exc:
        logger.warning(f"[policy] json_schema response_format failed ({exc}), falling back to json_object")
        try:
            return client.chat_completion(messages=messages, response_format={"type": "json_object"})
        except SarvamChatError as fallback_exc:
            raise PolicyServiceError(f"Sarvam chat completion failed: {fallback_exc}") from fallback_exc


def validate_response(raw_content: str | None, messages: list[dict]) -> dict:
    if raw_content:
        try:
            return json.loads(raw_content)
        except json.JSONDecodeError:
            pass

    logger.warning(
        f"[policy] response was empty or not valid JSON (raw_content={raw_content!r}), "
        "retrying once with a repair reminder"
    )
    repair_messages = messages + [
        {"role": "assistant", "content": raw_content or ""},
        {"role": "user", "content": _REPAIR_REMINDER},
    ]
    completion = call_sarvam(repair_messages)
    content = completion["choices"][0]["message"]["content"]
    if not content:
        raise PolicyServiceError("Sarvam returned an empty response after repair retry")
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise PolicyServiceError(f"Sarvam response was not valid JSON after repair retry: {exc}") from exc


def convert_to_model(parsed: dict, document: DocumentResult, claim: Claim) -> PolicyResult:
    try:
        return PolicyResult(
            **parsed,
            document_id=document.document_id,
            claim_id=claim.claim_id,
            processed_at=datetime.now(timezone.utc),
        )
    except ValidationError as exc:
        raise PolicyServiceError(f"Sarvam response did not match PolicyResult schema: {exc}") from exc


def extract_policy(document: DocumentResult, claim: Claim) -> PolicyResult:
    messages = prepare_prompt(document, claim)
    completion = call_sarvam(messages)

    usage = completion.get("usage") or {}
    logger.info(
        f"[policy] claim {claim.claim_id}: sarvam chat completion used "
        f"{usage.get('prompt_tokens')} prompt + {usage.get('completion_tokens')} completion "
        f"= {usage.get('total_tokens')} total tokens"
    )

    raw_content = completion["choices"][0]["message"]["content"]
    parsed = validate_response(raw_content, messages)
    return convert_to_model(parsed, document, claim)
