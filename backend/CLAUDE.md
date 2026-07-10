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

Run commands: `uv sync` to install deps, `uv run <script>` to execute within the venv. No dev server or CLI entrypoint is wired up yet (Phase 3).

## Current state
**Structure-only scaffold. No business logic exists yet.** `app/` was created in Phase 2 per `../projectfolder.txt` — every `.py` file under `app/` is an empty stub, every `.md` prompt file is empty. Do not assume any route, agent, or service does anything until you've checked — grep before relying on behavior.

Phase 3 (not started) wires up: FastAPI app init in `app/main.py`, `app/core/config.py` (Pydantic Settings), `app/core/logger.py`, a health check route, and `app/api/router.py` registration.

## Folder structure and responsibilities
```
app/
├── main.py            FastAPI app entrypoint
├── api/                API layer — routes only, no business logic
│   ├── deps.py         shared FastAPI dependencies
│   ├── router.py       aggregates and registers v1 routers
│   └── v1/             versioned routes: claims, documents, reports, health, upload
├── agents/             one self-contained folder per LangGraph agent
│   └── <name>/          __init__.py, agent.py (logic), prompt.py (prompt loading)
│       intake, policy, document, medical, billing, fraud, history, settlement, report, supervisor
├── core/                config, constants, logging, exceptions, security — cross-cutting
├── graph/               LangGraph wiring: builder.py, nodes.py, edges.py, state.py
├── models/              domain models (claim, document, report)
├── schemas/             Pydantic request/response schemas (claim, upload, policy, billing, medical, report)
├── services/             external integrations: sarvam.py, storage.py, parser.py, embeddings.py, search.py, report_generator.py
├── prompts/              versioned LLM prompts as .md files (one per agent, excluding history/supervisor)
└── utils/                shared helpers: files, helpers, validators, ids
tests/                    at backend/ root, not under app/
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
