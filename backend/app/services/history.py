from datetime import datetime, timezone

from qdrant_client import models

from app.models.billing import BillingResult
from app.models.claim import Claim
from app.models.history import HistoryResult, SimilarClaim
from app.models.medical import MedicalResult
from app.services.qdrant_client import CLAIM_HISTORY_COLLECTION, EMBEDDING_MODEL, get_qdrant_client, vector_name

_TOP_N = 3


class HistoryServiceError(Exception):
    pass


def _query_text(claim: Claim, diagnosis: str, payable_amount: float | None) -> str:
    parts = [f"Diagnosis: {diagnosis}.", f"Claim type: {claim.claim_type}."]
    if payable_amount is not None:
        parts.append(f"Payable amount: {payable_amount}.")
    return " ".join(parts)


def find_similar_claims(claim: Claim, medical_result: MedicalResult, billing_result: BillingResult | None) -> HistoryResult:
    diagnosis = medical_result.diagnosis
    payable_amount = billing_result.payable_amount if billing_result else None

    try:
        client = get_qdrant_client()
        if not client.collection_exists(CLAIM_HISTORY_COLLECTION):
            # No claims completed yet - nothing to search, and querying a
            # nonexistent collection would raise.
            hits = []
        else:
            response = client.query_points(
                collection_name=CLAIM_HISTORY_COLLECTION,
                query=models.Document(text=_query_text(claim, diagnosis, payable_amount), model=EMBEDDING_MODEL),
                using=vector_name(client),
                query_filter=models.Filter(
                    must_not=[models.FieldCondition(key="claim_id", match=models.MatchValue(value=claim.claim_id))]
                ),
                limit=_TOP_N,
            )
            hits = response.points
    except Exception as exc:  # Qdrant Cloud unreachable or other service error
        raise HistoryServiceError(f"Qdrant query failed: {exc}") from exc

    top_matches = [
        SimilarClaim(
            claim_id=hit.payload.get("claim_id", ""),
            similarity_score=round(hit.score, 3),
            diagnosis=hit.payload.get("diagnosis"),
            claim_type=hit.payload.get("claim_type"),
            matched_on=["semantic_similarity"],
        )
        for hit in hits
    ]

    if top_matches:
        summary = f"Found {len(top_matches)} similar prior claim(s), top similarity {top_matches[0].similarity_score:.2f}."
    else:
        summary = "No similar prior claims found."

    return HistoryResult(
        claim_id=claim.claim_id,
        similar_claims=top_matches,
        similarity_score=top_matches[0].similarity_score if top_matches else 0.0,
        historical_summary=summary,
        processed_at=datetime.now(timezone.utc),
    )
