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
Phases 3, 4, and 5 (of `../projectfolder.txt`) are implemented and pushed:
- **Phase 3** — `app/main.py` (FastAPI app + CORS + lifespan logging), `app/core/config.py` (`Settings` via Pydantic Settings), `app/core/logger.py` (loguru), `app/core/constants.py` (enums), `app/core/exceptions.py`, `app/api/v1/health.py`, `app/api/router.py`.
- **Phase 4** — claim intake: `app/schemas/claim.py`, `app/schemas/upload.py`, `app/schemas/document.py`, `app/models/claim.py`, `app/models/document.py`, `app/services/storage.py` (local-disk file validation/save, `uploads/temp/`), `app/services/claim_registry.py` (in-memory claim store), `app/api/deps.py`, `app/api/v1/claims.py` (`POST /claims`), `app/api/v1/upload.py` (`POST /claims/{claim_id}/upload`).
- **Phase 5** — LangGraph orchestration skeleton, verified end-to-end (see `backend/tests/test_claims_workflow.py`): `app/graph/state.py` (`ClaimState` TypedDict), `app/graph/nodes.py` (node wrapper functions for all 9 non-intake agents), `app/graph/builder.py` (compiled `StateGraph`, currently wires only `START -> supervisor -> policy -> END`; the other 7 node functions exist in `nodes.py` but aren't attached to the graph yet), `app/graph/edges.py` (no conditional routing yet — a linear chain doesn't need it). `app/agents/supervisor/agent.py` and `app/agents/intake/agent.py` have real deterministic logic (no LLM calls); the other 8 agent folders (`policy/document/medical/billing/fraud/history/settlement/report`) are intentional placeholder stages that just append their name to `workflow_history` — this matches the Phase 5 spec, not unfinished work. `app/prompts/*.md` (all 9, plus `app/agents/intake/prompt.py`) are placeholder content — real prompts arrive with Sarvam integration. `app/services/workflow.py` is the only module allowed to touch the compiled graph (`start_workflow`/`invoke_graph`/`resume_workflow`/`get_graph_state`). `app/services/document_registry.py` is an in-memory document store mirroring `claim_registry.py`. `app/core/types.py` defines `ClaimID`/`DocumentID`/`PolicyNumber`/`ClaimType` aliases.

Still empty stubs / not started: `app/services/{parser,sarvam,embeddings,search,report_generator}.py` (`sarvam.py` exists as a file but has zero implementation — a reserved placeholder for Phase 6), `app/schemas/{billing,medical,policy,report}.py`, `app/models/report.py`, `app/utils/{helpers,validators}.py`, `app/api/v1/{documents,reports}.py`. No Convex/DB persistence, no Sarvam/LLM calls, no OCR, no graph-level checkpointing — claim/document state lives only in in-memory dicts and resets on restart. Don't assume anything beyond what's listed above does something — grep before relying on behavior.

## Folder structure and responsibilities
```
app/
├── main.py            FastAPI app entrypoint — implemented
├── api/                API layer — routes only, no business logic
│   ├── deps.py         shared FastAPI dependencies — implemented (get_existing_claim)
│   ├── router.py       aggregates and registers v1 routers — implemented
│   └── v1/             claims.py, upload.py, health.py implemented; documents.py, reports.py still stub
├── agents/             one self-contained folder per LangGraph agent — supervisor + intake have real deterministic logic; the other 8 (policy, document, medical, billing, fraud, history, settlement, report) are intentional Phase 5 placeholders (append name to workflow_history, no LLM calls)
│   └── <name>/          __init__.py, agent.py (logic), prompt.py (prompt loading)
│       intake, policy, document, medical, billing, fraud, history, settlement, report, supervisor
├── core/                config.py, constants.py, logger.py, exceptions.py, types.py implemented; security.py placeholder-only
├── graph/               LangGraph wiring implemented — state.py, nodes.py, builder.py (compiles START -> supervisor -> policy -> END; 7 more node functions exist but aren't attached yet), edges.py (no conditional routing yet)
├── models/              claim.py, document.py implemented; report.py still stub
├── schemas/             claim.py, upload.py, document.py implemented; billing.py, medical.py, policy.py, report.py still stub
├── services/             storage.py, claim_registry.py, document_registry.py, workflow.py implemented (local-disk, in-memory, graph-invocation gateway); sarvam.py, parser.py, embeddings.py, search.py, report_generator.py still stub
├── prompts/              versioned LLM prompts as .md files — files exist for all 9 agents but content is still placeholder (Phase 6 fills in real prompts)
└── utils/                files.py, ids.py implemented; helpers.py, validators.py still stub
tests/                    at backend/ root, not under app/ — test_claims_workflow.py covers the Phase 5 end-to-end flow; no other tests yet
```

## Conventions
- Agent folders stay self-contained: `__init__.py`, `agent.py`, `prompt.py` — an agent's logic and prompt live together, not scattered.
- Keep prompts in `app/prompts/*.md`, not inlined in Python — they should be reviewable/versionable independently of code.
- Routes in `app/api/v1/` should stay thin; put logic in `app/services/` or `app/agents/`, not in route handlers.
- Env vars currently defined (see `.env.example`, real values in `.env` which is gitignored):
  - `SARVAM_API_KEY` — Sarvam AI (reasoning + OCR)
  - `CONVEX_URL`, `CONVEX_DEPLOY_KEY` — Convex DB/backend
  - `QDRANT_API_KEY`, `QDRANT_URL` — Qdrant vector search
  - `UPLOADTHING_TOKEN` — UploadThing storage; present in `Settings` but **not wired up yet** — Phase 4 upload endpoint stores files to a local `uploads/temp/` dir, not UploadThing. Will be integrated in a later storage-migration phase.
  Add new secrets to both `.env.example` (blank) and document them here + in `README.md`.

## MCP servers available (this machine only)
Registered locally with Claude Code (`--scope local`, private to this project/machine, not committed to git — check with `claude mcp list`):
- **`sarvam`** (`uvx sarvam-mcp`) — connected. Sarvam AI tools available directly in Claude Code sessions.
- **`convex`** (`cmd /c npx -y convex@latest mcp start`) — connected, authenticated with a **`prod:`** deploy key (`prod:ceaseless-sparrow-692`). This talks to the **production** Convex deployment, not a dev sandbox — be careful with any tool that writes data.
- **Qdrant has no MCP server registered.** Credentials exist (`QDRANT_API_KEY`, `QDRANT_URL`) but Qdrant access today is only via the `qdrant-client` Python SDK, and that SDK isn't installed or wired into `app/services/` yet either — don't assume Qdrant is reachable from Claude Code or from the app until that's actually built.
