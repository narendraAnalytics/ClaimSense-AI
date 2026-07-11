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
Backend is functionally complete for the core 9-agent pipeline (Phases 3-9 of `projectfolder.txt`). The graph runs the full chain: `START -> document -> supervisor -> policy -> medical -> billing -> fraud -> history -> settlement -> report -> END`. Uploaded documents get OCR'd via Sarvam Vision, then four agents make real Sarvam-30B reasoning calls (Policy, Medical, Billing, Fraud) and three run deterministic logic by design (History does local `difflib`-based similarity search, Settlement is a fixed rule cascade, Report renders a real PDF via `fpdf2`) — a deliberate hybrid chosen for auditability in a regulated domain, not a shortcut. A claim's final `POST /claims/{id}/process` response includes a coverage decision, medical validation, a computed payable amount, a 0-100 fraud score, similar-claim context, an approve/reject/need-review settlement recommendation, and a downloadable adjuster-ready PDF (`GET /claims/{id}/report`). All of this is live-verified against real Sarvam API calls and a real synthetic claim packet (policy PDF, discharge summary, prescription, lab report, hospital bill) — not mocked. Still no Convex/DB persistence and no graph-level checkpointing — re-processing a claim re-runs the entire pipeline (OCR + 4 reasoning calls + PDF generation) from scratch and spends real Sarvam credits every time; state resets on server restart. No auth on any endpoint. Copayment-percentage isn't deducted from the settlement amount yet (policy's `copayment` field is free text). What's next per `projectfolder.txt`: parallelizing the Billing/Fraud/History branch, Convex-backed persistent history search, and general production hardening (checkpointing, auth). Treat any claim about "what the app does" with suspicion until verified by reading actual code — the docs describe the target, and even this status note can drift from what's actually implemented.

## Scoping note
This project targets **production-grade engineering practices on demo-scale/synthetic data**, not a certified, regulator-approved production insurance system. Real deployment would additionally require regulatory compliance (IRDAI/HIPAA-equivalent), audited decisioning, legal review of auto-approval logic, and real claims data — none of which are in scope here. Keep this framing in mind when writing docs, code comments, or demo materials: be accurate about what's a working demo vs. what production would additionally require.

## Where to look
- Backend-specific guidance (stack, folder responsibilities, conventions): `backend/CLAUDE.md`
- Product/architecture spec (9 agents, models used, workflow diagrams): `insurance agent.txt`
- Backend folder-structure rationale: `projectfolder.txt`
