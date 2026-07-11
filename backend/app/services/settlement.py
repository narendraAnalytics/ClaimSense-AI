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
        reasoning = f"Rejected: fraud score {fraud_score} meets or exceeds the high-risk threshold of {_HIGH_FRAUD_THRESHOLD}."
        recommended_amount = 0.0
    elif policy_result is None or not policy_result.covered:
        decision = SettlementDecision.REJECT
        factors.append("policy not covered")
        reasoning = "Rejected: the policy coverage decision was not confirmed as covered."
        recommended_amount = 0.0
    elif (
        medical_result is not None
        and medical_result.validation_status == "inconsistent"
    ):
        decision = SettlementDecision.NEED_REVIEW
        factors.append("medical validation inconsistent")
        reasoning = "Needs review: the medical validation found a clinical inconsistency."
        recommended_amount = billing_result.payable_amount if billing_result else None
    elif fraud_score >= _REVIEW_FRAUD_THRESHOLD:
        decision = SettlementDecision.NEED_REVIEW
        factors.append(f"fraud_score >= {_REVIEW_FRAUD_THRESHOLD} (medium fraud risk)")
        reasoning = f"Needs review: fraud score {fraud_score} is elevated but below the reject threshold."
        recommended_amount = billing_result.payable_amount if billing_result else None
    elif billing_result is None or billing_result.error or billing_result.payable_amount is None:
        decision = SettlementDecision.NEED_REVIEW
        factors.append("billing validation missing or failed")
        reasoning = "Needs review: no reliable payable amount was computed by billing validation."
        recommended_amount = None
    else:
        decision = SettlementDecision.APPROVE
        factors.append("policy covered, medical validated, fraud risk low")
        # Note: policy's copayment is kept as a free-text string (same
        # rationale as its date fields — OCR'd wording is inconsistent),
        # so it is NOT deducted here. A known limitation, not an oversight.
        recommended_amount = billing_result.payable_amount
        reasoning = (
            f"Approved: policy covered, medical validation status "
            f"'{medical_result.validation_status if medical_result else 'unknown'}', "
            f"fraud score {fraud_score} below review threshold. Recommended amount is the "
            f"billing-validated payable amount; copayment percentage is not yet deducted."
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
