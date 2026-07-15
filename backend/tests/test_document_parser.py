from datetime import datetime, timezone
from pathlib import Path

from app.core.constants import DocumentStatus, DocumentType
from app.models.document import Document
from app.services import parser

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def _sample_document() -> Document:
    return Document(
        document_id="DOC-test",
        claim_id="CLM-test",
        filename="claim_form.pdf",
        mime_type="application/pdf",
        extension=".pdf",
        size=237436,
        document_type=DocumentType.POLICY,
        storage_id="test-storage-id",
        uploaded_at=datetime.now(timezone.utc),
    )


def test_parse_extraction_zip_normalizes_real_sarvam_output():
    zip_bytes = (FIXTURES_DIR / "sample_extraction.zip").read_bytes()

    result = parser.parse_extraction_zip(zip_bytes, _sample_document())

    assert result.status == DocumentStatus.PARSED
    assert result.page_count == 2
    assert len(result.pages) == 2
    assert result.markdown

    first_page = result.pages[0]
    assert first_page.page_num == 1
    assert first_page.text_blocks
    assert any("HDFC ERGO" in block.text for block in first_page.text_blocks)
    assert first_page.tables
    assert "<table" in first_page.tables[0].html


def test_parse_extraction_zip_rejects_invalid_zip():
    document = _sample_document()

    try:
        parser.parse_extraction_zip(b"not a zip", document)
        assert False, "expected DocumentParseError"
    except parser.DocumentParseError:
        pass
