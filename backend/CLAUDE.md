# backend/ — CLAUDE.md

Guidance for Claude Code when working in this directory. See the repo-root `CLAUDE.md` for overall project context.

## Stack
- Python ≥3.12, managed with `uv` (`pyproject.toml` + `uv.lock`, venv at `.venv/`)
- FastAPI (`fastapi[standard]`) for the HTTP API
- LangGraph + LangChain for multi-agent orchestration
- Pydantic / Pydantic Settings for schemas and config
- PyMuPDF + Pillow for document/image handling
- Sarvam AI (Sarvam-30B reasoning, Sarvam Vision OCR) as the LLM provider — OpenAI-compatible API, called via `httpx`/LangChain, not a dedicated SDK
- loguru for logging
- pytest (dev dependency, `[dependency-groups] dev` in `pyproject.toml`) for tests — run with `uv run pytest`

Run commands: `uv sync` to install deps, `uv run uvicorn app.main:app --reload` to run the dev server (`/health`, `/docs`, `/redoc` all live at that point).

## Current state
Phases 3, 4, 5, 6, and 7 (of `../projectfolder.txt`) are implemented and pushed:
- **Phase 3** — `app/main.py` (FastAPI app + CORS + lifespan logging), `app/core/config.py` (`Settings` via Pydantic Settings), `app/core/logger.py` (loguru), `app/core/constants.py` (enums), `app/core/exceptions.py`, `app/api/v1/health.py`, `app/api/router.py`.
- **Phase 4** — claim intake: `app/schemas/claim.py`, `app/schemas/upload.py`, `app/schemas/document.py`, `app/models/claim.py`, `app/models/document.py`, `app/services/storage.py` (local-disk file validation/save, `uploads/temp/`), `app/services/claim_registry.py` (in-memory claim store), `app/api/deps.py`, `app/api/v1/claims.py` (`POST /claims`), `app/api/v1/upload.py` (`POST /claims/{claim_id}/upload`).
- **Phase 5** — LangGraph orchestration skeleton, verified end-to-end (see `backend/tests/test_claims_workflow.py`): `app/graph/state.py` (`ClaimState` TypedDict), `app/graph/nodes.py` (node wrapper functions for all 9 non-intake agents), `app/graph/builder.py` (compiled `StateGraph`), `app/graph/edges.py` (no conditional routing yet — a linear chain doesn't need it). `app/agents/supervisor/agent.py` and `app/agents/intake/agent.py` have real deterministic logic (no LLM calls); the remaining placeholder stages just append their name to `workflow_history` — this matches spec, not unfinished work. `app/services/workflow.py` is the only module allowed to touch the compiled graph (`start_workflow`/`invoke_graph`/`resume_workflow`/`get_graph_state`). `app/services/document_registry.py` is an in-memory document store mirroring `claim_registry.py`. `app/core/types.py` defines `ClaimID`/`DocumentID`/`PolicyNumber`/`ClaimType` aliases.
- **Phase 6** — Document Intelligence Agent, the first real Sarvam call, verified against the **live** Sarvam API (not mocked) using a real HDFC ERGO claim form (`backend/tests/fixtures/claim_form.pdf`): `app/services/sarvam.py` (`SarvamVisionClient` — the full job pipeline: create job → get upload URLs → upload file → start job → poll status → get download URLs → download result; see the doc-links section below for the exact endpoint contracts), `app/services/parser.py` (`parse_extraction_zip` — normalizes the output ZIP's `document.md` + `metadata/page_*.json` per-page block data into internal models; structural normalization only, no semantic field extraction yet), `app/models/document_result.py` (`DocumentResult`/`DocumentPage`/`ExtractedText`/`ExtractedTable`), `app/agents/document/agent.py` (real per-document OCR with per-document failure isolation — one bad file doesn't fail the whole claim). The graph is rewired to `START -> document -> supervisor -> policy -> END` (Document Intelligence runs *before* the Supervisor per `projectfolder.txt`'s Phase 6 recommendation, so the Supervisor reasons over structured data). `app/prompts/document.md` documents the extraction/normalization contract (Sarvam Vision's job API takes `language`/`output_format`, not a chat prompt — the other 8 `app/prompts/*.md` files are still placeholders). Covered by `backend/tests/test_document_parser.py` (network-free, static fixture) and `backend/tests/test_document_intelligence.py` (live API call, skipped without `SARVAM_API_KEY`).
- **Phase 7** — Policy Coverage Agent, the first Sarvam-30B reasoning call in the codebase, live-verified against a real sample policy (`backend/tests/fixtures/BuildFlow_Health.pdf`, also at `backend/uploads/BuildFlow_Health.pdf`): `app/models/policy.py` (`PolicyResult`), `app/prompts/policy.md` (real system/user prompt — the second real prompt doc after `document.md`) + `app/agents/policy/prompt.py` (the first prompt-loading convention in this repo: reads/splits the `.md` file into system/user sections, `str.format()` templating), `app/services/sarvam.py` (`SarvamChatClient`/`SarvamChatError`/`get_sarvam_chat_client()` — a second client alongside `SarvamVisionClient` wrapping `/v1/chat/completions`), `app/services/policy.py` (`extract_policy()` — prompt prep, Sarvam call with `response_format: json_schema` structured-output + `json_object` fallback, one repair retry on invalid JSON, Pydantic conversion, token-usage logging), `app/agents/policy/agent.py` (real logic, replacing the placeholder — per-claim failure isolation matching `document/agent.py`'s pattern). `ClaimState` gained `policy_result`/`policy_status`/`coverage_summary`/`coverage_decision` (single-owner fields, seeded in `app/agents/intake/agent.py`); `ProcessClaimResponse` now exposes `policy_result`/`policy_status`. Graph wiring and the Supervisor were unchanged — both already routed to `policy` correctly. Covered by `backend/tests/test_policy_agent.py` (live, skipped without `SARVAM_API_KEY`).
  **Sarvam-30B quirk discovered building this**: thinking/reasoning mode is enabled by default and will silently consume the entire `max_tokens` budget on hidden `reasoning_content`, leaving `message.content` empty/`null`, even at `reasoning_effort="low"`. Fixed by sending `reasoning_effort: null` explicitly (`Settings.sarvam_chat_reasoning_effort` defaults to `None`, not omitted from the request payload) to fully disable reasoning for this extraction-style task. Also: `max_tokens` is hard-capped at 4096 for `sarvam-30b` on the starter subscription tier (a higher value 400s at the API) — `Settings.sarvam_chat_max_tokens` reflects that ceiling; raise it if the account is upgraded.

Still empty stubs / not started: `app/services/{embeddings,search,report_generator}.py`, `app/schemas/{billing,medical,report}.py`, `app/models/report.py`, `app/utils/{helpers,validators}.py`, `app/api/v1/{documents,reports}.py`, 7 of 9 `app/prompts/*.md` (all but `document.md` and `policy.md`). No Convex/DB persistence, no graph-level checkpointing — claim/document state lives only in in-memory dicts and resets on restart (re-calling `POST /claims/{id}/process` re-runs OCR *and* policy extraction from scratch and spends real Sarvam credits each time). Medical/Billing/Fraud agents still have no reasoning calls (Policy is the only real reasoning agent so far). Don't assume anything beyond what's listed above does something — grep before relying on behavior.

## Sarvam API reference (Document Intelligence + Chat Completions)
Endpoint docs consulted while building Phases 6-7 (`app/services/sarvam.py` already implements both flows — these links are for extending/debugging it, not re-deriving it). Auth header: `api-subscription-key`. Base URL: `https://api.sarvam.ai`.
- [Create Job](https://docs.sarvam.ai/api-reference-docs/document-intelligence)
- [Get Upload URLs](https://docs.sarvam.ai/api-reference-docs/document-intelligence/get-upload-links)
- [Start Job](https://docs.sarvam.ai/api-reference-docs/document-intelligence/start)
- [Get Job Status](https://docs.sarvam.ai/api-reference-docs/document-intelligence/get-status.md)
- [Get Download URLs](https://docs.sarvam.ai/api-reference-docs/document-intelligence/get-download-links.md)
- [Sarvam Vision model overview](https://docs.sarvam.ai/api-reference-docs/getting-started/models/sarvam-vision)
- [Chat Completions](https://docs.sarvam.ai/api-reference-docs/chat/chat-completions) — `/v1/chat/completions`, OpenAI-compatible, used by `SarvamChatClient` (Phase 7+)
- [Adjusting the model's thinking level (`reasoning_effort`)](https://docs.sarvam.ai/api-reference-docs/api-guides-tutorials/chat-completion/how-to/adjust-the-models-thinking-level) — read this before touching `sarvam_chat_reasoning_effort`; see the Phase 7 note above about the empty-content trap
- [Sarvam-30B model overview](https://docs.sarvam.ai/api-reference-docs/getting-started/models/sarvam-30b)
- [Full docs index](https://docs.sarvam.ai/llms-full.txt)

## Folder structure and responsibilities
```
app/
├── main.py            FastAPI app entrypoint — implemented
├── api/                API layer — routes only, no business logic
│   ├── deps.py         shared FastAPI dependencies — implemented (get_existing_claim)
│   ├── router.py       aggregates and registers v1 routers — implemented
│   └── v1/             claims.py, upload.py, health.py implemented; documents.py, reports.py still stub
├── agents/             one self-contained folder per LangGraph agent — supervisor, intake, document, and policy have real logic (document = real OCR via Sarvam Vision; policy = real Sarvam-30B reasoning); the other 6 (medical, billing, fraud, history, settlement, report) are intentional placeholders (append name to workflow_history, no LLM calls)
│   └── <name>/          __init__.py, agent.py (logic), prompt.py (prompt loading — only document and policy have real prompt.py content)
│       intake, policy, document, medical, billing, fraud, history, settlement, report, supervisor
├── core/                config.py, constants.py, logger.py, exceptions.py, types.py implemented; security.py placeholder-only
├── graph/               LangGraph wiring implemented — state.py, nodes.py, builder.py (compiles START -> document -> supervisor -> policy -> END; 6 more node functions exist but aren't attached yet), edges.py (no conditional routing yet)
├── models/              claim.py, document.py, document_result.py, policy.py implemented; report.py still stub
├── schemas/             claim.py, upload.py, document.py implemented; billing.py, medical.py, report.py still stub (policy.py deliberately left empty — PolicyResult lives in app/models/policy.py, no new API route was added in Phase 7)
├── services/             storage.py, claim_registry.py, document_registry.py, workflow.py, sarvam.py, parser.py, policy.py implemented; embeddings.py, search.py, report_generator.py still stub
├── prompts/              versioned LLM prompts as .md files — document.md and policy.md have real content; the other 7 are still placeholder
└── utils/                files.py, ids.py implemented; helpers.py, validators.py still stub
tests/                    at backend/ root, not under app/ — test_claims_workflow.py (Phase 5 flow), test_document_parser.py (network-free), test_document_intelligence.py (live, skipped without SARVAM_API_KEY), test_policy_agent.py (live, skipped without SARVAM_API_KEY); fixtures/ holds a real sample claim form, a sample policy PDF, and captured Sarvam output
```

## Conventions
- Agent folders stay self-contained: `__init__.py`, `agent.py`, `prompt.py` — an agent's logic and prompt live together, not scattered.
- Keep prompts in `app/prompts/*.md`, not inlined in Python — they should be reviewable/versionable independently of code.
- Routes in `app/api/v1/` should stay thin; put logic in `app/services/` or `app/agents/`, not in route handlers.
- Env vars currently defined (see `.env.example`, real values in `.env` which is gitignored):
  - `SARVAM_API_KEY` — Sarvam AI (reasoning + OCR; same key used by both `SarvamVisionClient` and `SarvamChatClient`, no separate chat key)
  - `CONVEX_URL`, `CONVEX_DEPLOY_KEY` — Convex DB/backend
  - `QDRANT_API_KEY`, `QDRANT_URL` — Qdrant vector search
  - `UPLOADTHING_TOKEN` — UploadThing storage; present in `Settings` but **not wired up yet** — Phase 4 upload endpoint stores files to a local `uploads/temp/` dir, not UploadThing. Will be integrated in a later storage-migration phase.
  Add new secrets to both `.env.example` (blank) and document them here + in `README.md`. Phase 7's `sarvam_chat_*` settings (`app/core/config.py`) needed no `.env.example` entry — they're non-secret tuned defaults, not credentials.

## MCP servers available (this machine only)
Registered locally with Claude Code (`--scope local`, private to this project/machine, not committed to git — check with `claude mcp list`):
- **`sarvam`** (`uvx sarvam-mcp`) — connected. Sarvam AI tools available directly in Claude Code sessions.
- **`convex`** (`cmd /c npx -y convex@latest mcp start`) — connected, authenticated with a **`prod:`** deploy key (`prod:ceaseless-sparrow-692`). This talks to the **production** Convex deployment, not a dev sandbox — be careful with any tool that writes data.
- **Qdrant has no MCP server registered.** Credentials exist (`QDRANT_API_KEY`, `QDRANT_URL`) but Qdrant access today is only via the `qdrant-client` Python SDK, and that SDK isn't installed or wired into `app/services/` yet either — don't assume Qdrant is reachable from Claude Code or from the app until that's actually built.
