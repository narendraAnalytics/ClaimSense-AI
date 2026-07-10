from datetime import datetime

from pydantic import BaseModel

from app.core.constants import DocumentStatus


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class ExtractedText(BaseModel):
    """One reading-order text block from a page (paragraph, headline,
    section-title, etc. — Sarvam's `layout_tag`)."""

    block_id: str
    layout_tag: str
    text: str
    confidence: float
    reading_order: int
    coordinates: BoundingBox


class ExtractedTable(BaseModel):
    """A table block. Sarvam returns table content as an inline HTML
    <table> string inside the block's text rather than a rows array — we
    keep it as raw HTML rather than hand-parsing it into rows, since no
    downstream agent needs structured rows yet (Phase 6 is structural
    normalization only, not semantic extraction)."""

    block_id: str
    html: str
    confidence: float
    reading_order: int
    coordinates: BoundingBox


class DocumentPage(BaseModel):
    page_num: int
    image_width: int
    image_height: int
    text_blocks: list[ExtractedText]
    tables: list[ExtractedTable]


class DocumentResult(BaseModel):
    document_id: str
    claim_id: str
    document_type: str
    status: DocumentStatus
    page_count: int
    pages: list[DocumentPage]
    markdown: str | None = None
    error: str | None = None
    processed_at: datetime
