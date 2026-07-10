# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is
**ClaimSense AI** — an AI-powered insurance claims intelligence platform. A 9-agent LangGraph pipeline (Intake Supervisor → Policy Coverage → Document Intelligence → [Medical, Billing, Fraud Detection in parallel] → Historical Similarity → Settlement Recommendation → Report Generation) that ingests claim documents (policy PDFs, medical records, ID proofs, evidence photos, etc.) and produces a decision-ready package: coverage validation, medical/billing validation, fraud risk score, similar-claim context, a settlement recommendation, and an adjuster-ready PDF report. Full spec: `insurance agent.txt`. Visual architecture reference: `claimsence.png`.

## Repo layout
```
backend/           FastAPI + LangGraph backend — see backend/CLAUDE.md for details
claimsence.png      architecture/design poster (reference image, not source of truth for code)
insurance agent.txt  full product/architecture spec
projectfolder.txt    Phase 2 backend folder-structure plan (already scaffolded)
```
**No frontend exists yet.** The spec calls for Next.js 16 + Convex, but that hasn't been started — currently this is a backend-only scaffold.

## Current status
Backend is past the scaffold stage. Phase 3 (FastAPI foundation: Pydantic Settings config, loguru logging, constants/enums, custom exceptions, health endpoint), Phase 4 (claim intake: Pydantic schemas/domain models, an in-memory claim registry, a local-disk upload service, `POST /claims` and `POST /claims/{claim_id}/upload`), and Phase 5 (LangGraph orchestration skeleton: `ClaimState` graph, a compiled `StateGraph` wiring `START -> supervisor -> policy -> END`, deterministic supervisor/intake agents, placeholder worker agents for the other 7 stages, placeholder prompt files, and a `workflow.py` service gating all graph access) are implemented and pushed, with the Phase 5 flow verified end-to-end by a pytest regression test (`backend/tests/test_claims_workflow.py`). `SARVAM_API_KEY` is present in `backend/.env` but still nothing calls the Sarvam API — no LLM/OCR calls, no Convex/DB persistence, and only 2 of the 9 graph nodes are actually wired into the compiled graph. Phase 6 (per `projectfolder.txt`) is next: the Document Intelligence Agent with Sarvam Vision, the first real Sarvam call. Treat any claim about "what the app does" with suspicion until verified by reading actual code — the docs describe the target, and even this status note can drift from what's actually implemented.

## Scoping note
This project targets **production-grade engineering practices on demo-scale/synthetic data**, not a certified, regulator-approved production insurance system. Real deployment would additionally require regulatory compliance (IRDAI/HIPAA-equivalent), audited decisioning, legal review of auto-approval logic, and real claims data — none of which are in scope here. Keep this framing in mind when writing docs, code comments, or demo materials: be accurate about what's a working demo vs. what production would additionally require.

## Where to look
- Backend-specific guidance (stack, folder responsibilities, conventions): `backend/CLAUDE.md`
- Product/architecture spec (9 agents, models used, workflow diagrams): `insurance agent.txt`
- Backend folder-structure rationale: `projectfolder.txt`
