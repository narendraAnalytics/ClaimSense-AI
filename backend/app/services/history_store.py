"""In-memory store of completed-claim summaries for the Historical
Similarity agent's local search. Populated by the Report agent (the last
real agent in the graph) once a claim's full pipeline has finished, so a
claim never matches against itself. This is a deliberate "for now" local
implementation — a later phase can replace it with Convex-backed search
without changing the Historical Similarity agent's interface.
"""

_claim_summaries: list[dict] = []


def save_claim_summary(summary: dict) -> None:
    _claim_summaries.append(summary)


def list_claim_summaries(exclude_claim_id: str | None = None) -> list[dict]:
    if exclude_claim_id is None:
        return list(_claim_summaries)
    return [s for s in _claim_summaries if s.get("claim_id") != exclude_claim_id]
