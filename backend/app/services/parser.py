import io
import json
import zipfile
from datetime import datetime, timezone

from app.core.constants import DocumentStatus
from app.models.document import Document
from app.models.document_result import (
    BoundingBox,
    DocumentPage,
    DocumentResult,
    ExtractedTable,
    ExtractedText,
)


class DocumentParseError(Exception):
    pass


def parse_extraction_zip(zip_bytes: bytes, document: Document) -> DocumentResult:
    """Normalizes a Sarvam Document Intelligence output ZIP (a top-level
    document.md/html plus one metadata/page_NNN.json per page) into the
    internal DocumentResult model. Structural normalization only — no
    semantic field extraction (policy number, patient name, etc.), which is
    downstream agent work in a later phase."""
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as archive:
            names = archive.namelist()
            page_names = sorted(n for n in names if n.startswith("metadata/page_") and n.endswith(".json"))
            if not page_names:
                raise DocumentParseError("No metadata/page_*.json files found in Sarvam output ZIP")

            markdown_name = next((n for n in names if n.endswith(".md")), None)
            markdown = archive.read(markdown_name).decode("utf-8") if markdown_name else None

            pages = [_parse_page(json.loads(archive.read(name))) for name in page_names]
    except zipfile.BadZipFile as exc:
        raise DocumentParseError(f"Sarvam output is not a valid ZIP: {exc}") from exc

    return DocumentResult(
        document_id=document.document_id,
        claim_id=document.claim_id,
        document_type=document.document_type.value,
        status=DocumentStatus.PARSED,
        page_count=len(pages),
        pages=pages,
        markdown=markdown,
        processed_at=datetime.now(timezone.utc),
    )


def _parse_page(raw_page: dict) -> DocumentPage:
    text_blocks: list[ExtractedText] = []
    tables: list[ExtractedTable] = []

    for block in raw_page.get("blocks", []):
        coordinates = BoundingBox(**block["coordinates"])
        if block.get("layout_tag") == "table":
            tables.append(
                ExtractedTable(
                    block_id=block["block_id"],
                    html=block["text"],
                    confidence=block["confidence"],
                    reading_order=block["reading_order"],
                    coordinates=coordinates,
                )
            )
        else:
            text_blocks.append(
                ExtractedText(
                    block_id=block["block_id"],
                    layout_tag=block.get("layout_tag", "unknown"),
                    text=block["text"],
                    confidence=block["confidence"],
                    reading_order=block["reading_order"],
                    coordinates=coordinates,
                )
            )

    return DocumentPage(
        page_num=raw_page["page_num"],
        image_width=raw_page["image_width"],
        image_height=raw_page["image_height"],
        text_blocks=text_blocks,
        tables=tables,
    )
