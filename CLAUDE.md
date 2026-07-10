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
Backend is past the scaffold stage. Phase 3 (FastAPI foundation), Phase 4 (claim intake: `POST /claims`, `POST /claims/{claim_id}/upload`), Phase 5 (LangGraph orchestration skeleton with a `workflow.py` service gating all graph access, verified end-to-end by a pytest regression test), and Phase 6 (Document Intelligence Agent: real OCR via Sarvam Vision, the first real Sarvam API call, live-verified against a real HDFC ERGO claim form — not mocked) are implemented and pushed. The graph now runs `START -> document -> supervisor -> policy -> END`, so uploaded documents get OCR'd into structured JSON before the Supervisor sees them. Still no reasoning-model (Sarvam-30B) calls, no Convex/DB persistence, no graph-level checkpointing (re-processing a claim re-runs OCR from scratch and spends real Sarvam credits), and only 3 of the 9 graph nodes are actually wired into the compiled graph. Phase 7+ (per `projectfolder.txt`) is next: real reasoning for Policy/Medical/Billing/Fraud agents. Treat any claim about "what the app does" with suspicion until verified by reading actual code — the docs describe the target, and even this status note can drift from what's actually implemented.

## Scoping note
This project targets **production-grade engineering practices on demo-scale/synthetic data**, not a certified, regulator-approved production insurance system. Real deployment would additionally require regulatory compliance (IRDAI/HIPAA-equivalent), audited decisioning, legal review of auto-approval logic, and real claims data — none of which are in scope here. Keep this framing in mind when writing docs, code comments, or demo materials: be accurate about what's a working demo vs. what production would additionally require.

## Where to look
- Backend-specific guidance (stack, folder responsibilities, conventions): `backend/CLAUDE.md`
- Product/architecture spec (9 agents, models used, workflow diagrams): `insurance agent.txt`
- Backend folder-structure rationale: `projectfolder.txt`
