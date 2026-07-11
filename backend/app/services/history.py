from datetime import datetime, timezone
from difflib import SequenceMatcher

from app.models.billing import BillingResult
from app.models.claim import Claim
from app.models.history import HistoryResult, SimilarClaim
from app.models.medical import MedicalResult
from app.services import history_store

_TOP_N = 3
_MIN_SIMILARITY = 0.35


def _text_similarity(a: str | None, b: str | None) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _amount_closeness(a: float | None, b: float | None) -> float:
    if a is None or b is None or a <= 0 or b <= 0:
        return 0.0
    ratio = min(a, b) / max(a, b)
    return ratio


def find_similar_claims(
    claim: Claim, medical_result: MedicalResult | None, billing_result: BillingResult | None
) -> HistoryResult:
    diagnosis = medical_result.diagnosis if medical_result else None
    payable_amount = billing_result.payable_amount if billing_result else None

    candidates = history_store.list_claim_summaries(exclude_claim_id=claim.claim_id)

    scored: list[SimilarClaim] = []
    for candidate in candidates:
        matched_on: list[str] = []
        diagnosis_score = _text_similarity(diagnosis, candidate.get("diagnosis"))
        if diagnosis_score >= 0.5:
            matched_on.append("diagnosis")

        type_score = 1.0 if candidate.get("claim_type") == claim.claim_type else 0.0
        if type_score:
            matched_on.append("claim_type")

        amount_score = _amount_closeness(payable_amount, candidate.get("payable_amount"))
        if amount_score >= 0.8:
            matched_on.append("payable_amount")

        # Weighted blend: diagnosis text similarity carries the most signal,
        # claim type and amount closeness are secondary corroborating signals.
        combined = (0.6 * diagnosis_score) + (0.25 * type_score) + (0.15 * amount_score)

        if combined >= _MIN_SIMILARITY:
            scored.append(
                SimilarClaim(
                    claim_id=candidate.get("claim_id", ""),
                    similarity_score=round(combined, 3),
                    diagnosis=candidate.get("diagnosis"),
                    claim_type=candidate.get("claim_type"),
                    matched_on=matched_on,
                )
            )

    scored.sort(key=lambda s: s.similarity_score, reverse=True)
    top_matches = scored[:_TOP_N]

    if top_matches:
        summary = (
            f"Found {len(top_matches)} similar prior claim(s) out of {len(candidates)} "
            f"searched, top similarity {top_matches[0].similarity_score:.2f}."
        )
    else:
        summary = f"No similar prior claims found among {len(candidates)} searched."

    return HistoryResult(
        claim_id=claim.claim_id,
        similar_claims=top_matches,
        similarity_score=top_matches[0].similarity_score if top_matches else 0.0,
        historical_summary=summary,
        processed_at=datetime.now(timezone.utc),
    )
