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
Backend folder structure is scaffolded (`backend/app/...`) per `projectfolder.txt` — **structure only, no business logic yet.** `SARVAM_API_KEY` is present in `backend/.env` but nothing calls the Sarvam API yet. Zero git commits so far. Treat any claim about "what the app does" with suspicion until verified by reading actual code — the docs describe the target, not the current implementation.

## Scoping note
This project targets **production-grade engineering practices on demo-scale/synthetic data**, not a certified, regulator-approved production insurance system. Real deployment would additionally require regulatory compliance (IRDAI/HIPAA-equivalent), audited decisioning, legal review of auto-approval logic, and real claims data — none of which are in scope here. Keep this framing in mind when writing docs, code comments, or demo materials: be accurate about what's a working demo vs. what production would additionally require.

## Where to look
- Backend-specific guidance (stack, folder responsibilities, conventions): `backend/CLAUDE.md`
- Product/architecture spec (9 agents, models used, workflow diagrams): `insurance agent.txt`
- Backend folder-structure rationale: `projectfolder.txt`
