from app.models.claim import Claim

_claims: dict[str, Claim] = {}


def add_claim(claim: Claim) -> None:
    _claims[claim.claim_id] = claim


def get_claim(claim_id: str) -> Claim | None:
    return _claims.get(claim_id)


def claim_exists(claim_id: str) -> bool:
    return claim_id in _claims


def attach_document(claim_id: str, document_id: str) -> None:
    claim = _claims[claim_id]
    claim.documents.append(document_id)
