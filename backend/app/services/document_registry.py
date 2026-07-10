from app.models.document import Document

_documents: dict[str, Document] = {}


def add_document(document: Document) -> None:
    _documents[document.document_id] = document


def get_document(document_id: str) -> Document | None:
    return _documents.get(document_id)


def get_documents_for_claim(claim_id: str) -> list[Document]:
    return [doc for doc in _documents.values() if doc.claim_id == claim_id]
