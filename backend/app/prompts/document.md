# Document Intelligence — Extraction & Normalization Contract

The Document Intelligence Agent doesn't call a chat/reasoning model — Sarvam
Vision's Document Intelligence API is a job-based OCR pipeline configured by
`job_parameters` (language, output format), not a prompt. This file documents
the extraction/normalization contract `app/agents/document/agent.py` and
`app/services/parser.py` follow.

## Job configuration
- **Language**: `en-IN` by default (`Settings.sarvam_vision_language`) — override
  per-document if a claim's documents are in another supported Indic language.
- **Output format**: `md` (`Settings.sarvam_vision_output_format`) — Sarvam's job
  API only accepts `html` or `md` at creation time; per-page structured JSON
  (`metadata/page_*.json`) is always included in the output ZIP regardless of
  this setting, and that JSON is what the parser actually normalizes.
- **Supported inputs**: PDF, JPEG, PNG (max 10 pages, max 200MB). Unsupported
  mime types (e.g. `image/webp`, which our upload endpoint accepts but Sarvam
  Vision doesn't) are skipped and marked failed for that document rather than
  sent to the API.

## Normalization scope (structural only)
The parser converts Sarvam's per-page block output into `DocumentResult`:
- Each page's text blocks (paragraphs, headlines, section titles, etc.) become
  `ExtractedText` entries, keeping Sarvam's `layout_tag`, confidence, reading
  order, and bounding box.
- Table blocks (`layout_tag == "table"`) become `ExtractedTable` entries. Sarvam
  returns table content as an inline HTML `<table>` string — the parser keeps
  that raw HTML rather than hand-parsing it into rows, since no downstream
  agent needs structured rows yet.
- The whole-document markdown (`document.md`) is kept as-is on `DocumentResult.markdown`.

**Out of scope for this phase**: semantic field extraction (policy number,
claimant name, diagnosis, claim amount, etc.). That's reasoning work for the
Policy/Medical/Billing agents in later phases, consuming this structural
output — Phase 6 only proves OCR → structured JSON → graph state works.
