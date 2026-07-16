# ClaimSense AI — Backend

FastAPI + LangGraph backend for ClaimSense AI, an AI-powered insurance claims intelligence platform. See the [repo-root README](../README.md) for the full project overview.

## Status

🚧 **Early scaffold.** The `app/` folder structure is in place (Phase 2), but contains no business logic yet — every file is an empty stub. Phase 3 (FastAPI app init, config, logging, health check, agent implementations) is not started.

## Tech stack

- **Language/runtime**: Python ≥3.12, managed with [uv](https://docs.astral.sh/uv/)
- **API**: FastAPI
- **Orchestration**: LangGraph + LangChain (multi-agent workflow)
- **Validation**: Pydantic / Pydantic Settings
- **Documents**: PyMuPDF, Pillow
- **AI models**: [Sarvam AI](https://docs.sarvam.ai) — Sarvam-30B (reasoning, OpenAI-compatible API), Sarvam Vision (OCR/document understanding)
- **Logging**: loguru

## Folder structure

```
app/
├── main.py            FastAPI entrypoint
├── api/v1/              claims, documents, reports, health, upload routes
├── agents/              one folder per LangGraph agent (intake, policy, document,
│                        medical, billing, fraud, history, settlement, report, supervisor)
├── core/                config, logging, constants, exceptions, security
├── graph/                LangGraph builder, nodes, edges, state
├── models/               domain models
├── schemas/              Pydantic request/response schemas
├── services/              integrations: Sarvam client, storage, parser, embeddings, search, report generation
├── prompts/               versioned LLM prompts (.md)
└── utils/                 shared helpers
tests/
```

See `../CLAUDE.md` and `CLAUDE.md` for detailed folder responsibilities and conventions.

## Setup

```bash
cd backend
uv sync                        # install dependencies
cp .env.example .env           # then fill in SARVAM_API_KEY
```

### Environment variables

| Variable | Description |
|---|---|
| `SARVAM_API_KEY` | API key for Sarvam AI (reasoning + OCR models) |

## Running

No dev server is wired up yet. Once Phase 3 lands, this section will document `uv run fastapi dev app/main.py` (or equivalent) to start the API.

## Roadmap

- [x] Phase 2 — Production folder structure scaffolded
- [ ] Phase 3 — FastAPI app init, config, logging, health check endpoint, router registration
- [ ] Phase 4 — Sarvam client + first agents (Intake Supervisor, Policy Coverage, Document Intelligence)
- [ ] Phase 5 — Remaining agents, LangGraph wiring, Convex integration

<!-- branch-protection test: safe to remove -->
