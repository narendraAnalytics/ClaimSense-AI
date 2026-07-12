"""Persists completed-claim summaries to Qdrant for the Historical
Similarity agent's semantic search. Populated by the Report agent (the last
real agent in the graph) once a claim's full pipeline has finished, so a
claim never matches against itself.
"""

from qdrant_client import models

from app.core.logger import logger
from app.services.qdrant_client import (
    CLAIM_HISTORY_COLLECTION,
    EMBEDDING_MODEL,
    claim_point_id,
    ensure_collection,
    get_qdrant_client,
    vector_name,
)


def _embedding_text(summary: dict) -> str:
    parts = [f"Diagnosis: {summary['diagnosis']}."]
    if summary.get("claim_type"):
        parts.append(f"Claim type: {summary['claim_type']}.")
    if summary.get("policy_number"):
        parts.append(f"Policy: {summary['policy_number']}.")
    if summary.get("payable_amount") is not None:
        parts.append(f"Payable amount: {summary['payable_amount']}.")
    if summary.get("fraud_score") is not None:
        parts.append(f"Fraud score: {summary['fraud_score']}.")
    if summary.get("settlement_decision"):
        parts.append(f"Settlement decision: {summary['settlement_decision']}.")
    return " ".join(parts)


def save_claim_summary(summary: dict) -> None:
    # Nothing meaningful to embed without a diagnosis - skip rather than
    # polluting the collection with empty-content points.
    if not summary.get("diagnosis"):
        return

    try:
        client = get_qdrant_client()
        ensure_collection(client, CLAIM_HISTORY_COLLECTION)
        client.upsert(
            collection_name=CLAIM_HISTORY_COLLECTION,
            points=[
                models.PointStruct(
                    id=claim_point_id(summary["claim_id"]),
                    vector={vector_name(client): models.Document(text=_embedding_text(summary), model=EMBEDDING_MODEL)},
                    payload=summary,
                )
            ],
        )
    except Exception as exc:  # network/service errors from Qdrant Cloud
        logger.error(f"[history_store] failed to save claim summary for {summary.get('claim_id')}: {exc}")
