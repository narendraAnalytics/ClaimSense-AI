import re
from datetime import datetime, timezone

from app.core.constants import SettlementDecision
from app.models.billing import BillingResult
from app.models.fraud import FraudResult
from app.models.medical import MedicalResult
from app.models.policy import PolicyResult
from app.models.settlement import SettlementResult

# Deterministic rules, not an LLM call — regulated claims adjudication
# requires an auditable, explainable decision trail (NAIC/EU AI Act-style
# transparency expectations), so Settlement aggregates the already-reasoned
# outputs of Policy/Medical/Billing/Fraud through a fixed rule cascade
# rather than a 5th opaque model call.
_HIGH_FRAUD_THRESHOLD = 70
_REVIEW_FRAUD_THRESHOLD = 30

_COPAY_PERCENT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*%")
_COPAY_NIL_TEXT = {"nil", "none", "n/a", "na", "not applicable", "no copay", "0", "0%"}


def _parse_copayment_percent(copayment: str | None) -> float | None:
    """Extracts a copayment percentage from policy_result.copayment's free
    text (kept as a raw string, not a number, since OCR'd wording is
    inconsistent — see app/models/policy.py). Returns None when nothing
    parseable is found, so the caller can skip the deduction rather than
    guess.
    """
    if not copayment:
        return None
    if copayment.strip().lower() in _COPAY_NIL_TEXT:
        return 0.0
    match = _COPAY_PERCENT_RE.search(copayment)
    return float(match.group(1)) if match else None


def _apply_policy_deductions(payable_amount: float, policy_result: PolicyResult) -> tuple[float, list[str]]:
    """Deterministically applies the policy's deductible then copayment to
    the billing-validated payable amount, in Python — never trusting an LLM
    with claim arithmetic, same rationale as payable_amount itself
    (app/services/billing.py).
    """
    factors: list[str] = []
    amount = payable_amount

    deductible = policy_result.deductible
    if deductible is not None and deductible > 0:
        amount = max(amount - deductible, 0.0)
        factors.append(f"deductible of {deductible} applied")

    copay_percent = _parse_copayment_percent(policy_result.copayment)
    if copay_percent is not None and copay_percent > 0:
        copay_share = amount * (copay_percent / 100)
        amount -= copay_share
        factors.append(f"copayment of {copay_percent}% applied (insured share {round(copay_share, 2)})")
    elif copay_percent is None and policy_result.copayment:
        factors.append(f"copayment text '{policy_result.copayment}' could not be parsed — not deducted")

    return round(amount, 2), factors


def recommend_settlement(
    claim_id: str,
    policy_result: PolicyResult | None,
    medical_result: MedicalResult | None,
    billing_result: BillingResult | None,
    fraud_result: FraudResult | None,
) -> SettlementResult:
    factors: list[str] = []
    fraud_score = fraud_result.fraud_score if fraud_result else 0
    factors.append(f"fraud_score={fraud_score}")

    if fraud_result is None or fraud_score >= _HIGH_FRAUD_THRESHOLD:
        decision = SettlementDecision.REJECT
        factors.append(f"fraud_score >= {_HIGH_FRAUD_THRESHOLD} (high fraud risk)")
        reasoning = (
            f"High Risk - Manual Review Required: fraud score {fraud_score} meets or exceeds "
            f"the high-risk threshold of {_HIGH_FRAUD_THRESHOLD}. Recommended for manual "
            f"investigation before any settlement decision."
        )
        recommended_amount = 0.0
    elif policy_result is None or not policy_result.covered:
        decision = SettlementDecision.REJECT
        factors.append("policy not covered")
        reasoning = (
            "High Risk - Manual Review Required: the policy coverage decision was not "
            "confirmed as covered. Recommended for manual investigation before any "
            "settlement decision."
        )
        recommended_amount = 0.0
    elif (
        medical_result is not None
        and medical_result.validation_status == "inconsistent"
    ):
        decision = SettlementDecision.NEED_REVIEW
        factors.append("medical validation inconsistent")
        reasoning = "Needs review: the medical validation found a clinical inconsistency."
        if billing_result and billing_result.payable_amount is not None:
            recommended_amount, deduction_factors = _apply_policy_deductions(
                billing_result.payable_amount, policy_result
            )
            factors.extend(deduction_factors)
        else:
            recommended_amount = None
    elif fraud_score >= _REVIEW_FRAUD_THRESHOLD:
        decision = SettlementDecision.NEED_REVIEW
        factors.append(f"fraud_score >= {_REVIEW_FRAUD_THRESHOLD} (medium fraud risk)")
        reasoning = f"Needs review: fraud score {fraud_score} is elevated but below the reject threshold."
        if billing_result and billing_result.payable_amount is not None:
            recommended_amount, deduction_factors = _apply_policy_deductions(
                billing_result.payable_amount, policy_result
            )
            factors.extend(deduction_factors)
        else:
            recommended_amount = None
    elif billing_result is None or billing_result.error or billing_result.payable_amount is None:
        decision = SettlementDecision.NEED_REVIEW
        factors.append("billing validation missing or failed")
        reasoning = "Needs review: no reliable payable amount was computed by billing validation."
        recommended_amount = None
    else:
        decision = SettlementDecision.APPROVE
        factors.append("policy covered, medical validated, fraud risk low")
        recommended_amount, deduction_factors = _apply_policy_deductions(billing_result.payable_amount, policy_result)
        factors.extend(deduction_factors)
        reasoning = (
            f"Approved: policy covered, medical validation status "
            f"'{medical_result.validation_status if medical_result else 'unknown'}', "
            f"fraud score {fraud_score} below review threshold. Recommended amount is the "
            f"billing-validated payable amount after deductible/copayment: {', '.join(deduction_factors) if deduction_factors else 'no deductions applied'}."
        )

    confidences = [
        r.confidence
        for r in (policy_result, medical_result, billing_result, fraud_result)
        if r is not None
    ]
    confidence = sum(confidences) / len(confidences) if confidences else 0.0

    return SettlementResult(
        claim_id=claim_id,
        approval_status=decision,
        recommended_amount=recommended_amount,
        confidence=round(confidence, 3),
        reasoning=reasoning,
        contributing_factors=factors,
        processed_at=datetime.now(timezone.utc),
    )
