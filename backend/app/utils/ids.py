import uuid


def generate_claim_id() -> str:
    return f"CLM-{uuid.uuid4().hex[:10]}"


def generate_document_id() -> str:
    return f"DOC-{uuid.uuid4().hex[:12]}"
