"""Network-free unit tests for the deterministic settlement rule cascade
(app/services/settlement.py) — no Sarvam API calls, no fixtures needed.
"""

from datetime import datetime, timezone

from app.core.constants import SettlementDecision
from app.models.fraud import FraudResult
from app.models.policy import PolicyResult
from app.services.settlement import _apply_policy_deductions, recommend_settlement


def _policy(**overrides) -> PolicyResult:
    defaults = dict(
        document_id="doc-1",
        claim_id="CLM-1",
        is_policy_document=True,
        covered=True,
        deductible=None,
        copayment=None,
        sum_insured=None,
        processed_at=datetime.now(timezone.utc),
    )
    defaults.update(overrides)
    return PolicyResult(**defaults)


def _fraud(**overrides) -> FraudResult:
    defaults = dict(
        claim_id="CLM-1",
        fraud_score=0,
        processed_at=datetime.now(timezone.utc),
    )
    defaults.update(overrides)
    return FraudResult(**defaults)


def test_no_deductions_no_cap():
    amount, factors, billing_validated = _apply_policy_deductions(100_000.0, _policy())
    assert amount == 100_000.0
    assert billing_validated == 100_000.0
    assert factors == []


def test_deductible_only():
    amount, factors, billing_validated = _apply_policy_deductions(100_000.0, _policy(deductible=5_000.0))
    assert amount == 95_000.0
    assert billing_validated == 95_000.0
    assert any("deductible" in f for f in factors)


def test_copayment_only():
    amount, factors, billing_validated = _apply_policy_deductions(100_000.0, _policy(copayment="10%"))
    assert amount == 90_000.0
    assert billing_validated == 90_000.0
    assert any("copayment" in f for f in factors)


def test_deductible_and_copayment():
    amount, factors, billing_validated = _apply_policy_deductions(
        100_000.0, _policy(deductible=5_000.0, copayment="10%")
    )
    # (100000 - 5000) * 0.9 = 85500
    assert amount == 85_500.0
    assert billing_validated == 85_500.0


def test_floors_at_zero():
    amount, factors, billing_validated = _apply_policy_deductions(1_000.0, _policy(deductible=5_000.0))
    assert amount == 0.0
    assert billing_validated == 0.0


def test_unparseable_copayment_not_deducted():
    amount, factors, billing_validated = _apply_policy_deductions(
        100_000.0, _policy(copayment="as per policy schedule")
    )
    assert amount == 100_000.0
    assert billing_validated == 100_000.0
    assert any("could not be parsed" in f for f in factors)


def test_capped_at_sum_insured():
    # From frontend/pdffile.txt's worked example: sum insured 2,00,000,
    # billing-validated amount 4,10,000 -> final recommended 2,00,000.
    amount, factors, billing_validated = _apply_policy_deductions(
        410_000.0, _policy(sum_insured=200_000.0)
    )
    assert amount == 200_000.0
    assert billing_validated == 410_000.0
    assert any("capped at policy sum insured" in f for f in factors)


def test_sum_insured_cap_applies_after_deductions():
    # deductible/copay bring it to 85,500; sum insured of 50,000 should
    # still cap the final amount below that.
    amount, factors, billing_validated = _apply_policy_deductions(
        100_000.0, _policy(deductible=5_000.0, copayment="10%", sum_insured=50_000.0)
    )
    assert billing_validated == 85_500.0
    assert amount == 50_000.0
    assert any("capped at policy sum insured" in f for f in factors)


def test_sum_insured_above_amount_no_cap():
    amount, factors, billing_validated = _apply_policy_deductions(
        100_000.0, _policy(sum_insured=500_000.0)
    )
    assert amount == 100_000.0
    assert billing_validated == 100_000.0
    assert not any("capped" in f for f in factors)


def test_coverage_pending_when_no_policy_document():
    result = recommend_settlement(
        claim_id="CLM-1",
        policy_result=None,
        medical_result=None,
        billing_result=None,
        fraud_result=_fraud(),
    )
    assert result.approval_status == SettlementDecision.NEED_REVIEW
    assert result.recommended_amount is None
    assert "Coverage Pending" in result.reasoning
    assert any("no policy document uploaded" in f for f in result.contributing_factors)


def test_coverage_pending_when_covered_undetermined():
    result = recommend_settlement(
        claim_id="CLM-1",
        policy_result=_policy(covered=None),
        medical_result=None,
        billing_result=None,
        fraud_result=_fraud(),
    )
    assert result.approval_status == SettlementDecision.NEED_REVIEW
    assert "Coverage Pending" in result.reasoning
    assert any("could not be determined" in f for f in result.contributing_factors)


def test_not_covered_when_policy_confirms_no_coverage():
    result = recommend_settlement(
        claim_id="CLM-1",
        policy_result=_policy(covered=False),
        medical_result=None,
        billing_result=None,
        fraud_result=_fraud(),
    )
    assert result.approval_status == SettlementDecision.NEED_REVIEW
    assert result.recommended_amount is None
    assert "Not Covered" in result.reasoning
    assert "Coverage Pending" not in result.reasoning
    assert any("policy confirmed not covered" in f for f in result.contributing_factors)
