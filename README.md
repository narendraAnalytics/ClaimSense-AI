# ClaimSense AI

### AI-Powered Insurance Claims Intelligence Platform

Transform insurance claim processing with autonomous AI agents that analyze documents, validate policies, detect fraud, calculate settlements, and generate decision-ready reports — in minutes instead of days.

---

## The problem

Traditional insurance claim processing relies on manual document review, slow approvals, error-prone calculations, and inconsistent decisions — driving up costs and customer wait times. ClaimSense AI automates the repetitive parts of the First Notice of Loss (FNOL) pipeline while keeping humans in the loop for high-risk or ambiguous cases.

## How it works

A pipeline of 9 specialized LangGraph-orchestrated AI agents, each responsible for one step, passing structured output to the next:

```text
User Upload
    │
    ▼
Intake Supervisor  →  Policy Coverage  →  Document Intelligence (OCR)
                                                 │
                          ┌──────────────────────┼──────────────────────┐
                          ▼                      ▼                      ▼
                   Medical Validation     Billing Validation     Fraud Detection
                          │                      │                      │
                          └──────────────────────┼──────────────────────┘
                                                  ▼
                                     Historical Similarity Search
                                                  │
                                                  ▼
                                   Settlement Recommendation
                                                  │
                                                  ▼
                                     Report Generation
                                                  │
                            ┌─────────────────────┼─────────────────────┐
                            ▼                     ▼                     ▼
                     Auto-Approve          Human Review              Reject
```

Full architecture and per-agent responsibilities: [`insurance agent.txt`](./insurance%20agent.txt). Visual reference: [`claimsence.png`](./claimsence.png).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React, Tailwind CSS, shadcn/ui, TypeScript *(not started)* |
| Backend | FastAPI, Python, LangGraph, Pydantic |
| AI | Sarvam-30B (reasoning), Sarvam Vision (OCR) |
| Database | Convex (DB, Storage, Search, Scheduler) *(not started)* |
| Auth | Convex Auth *(not started)* |
| Deployment | Railway (backend), Vercel (frontend) *(not started)* |

## Project status

🚧 **Early-stage, actively being built.** Currently a backend-only repository:

- ✅ Backend project scaffolded with `uv` (Python ≥3.12, FastAPI/LangGraph/LangChain dependencies installed)
- ✅ Production-style folder structure in place (`backend/app/{api,agents,core,graph,models,schemas,services,prompts,utils}`)
- ⬜ Business logic — not started (every file is currently an empty stub)
- ⬜ Sarvam AI integration — API key configured, no client wired up yet
- ⬜ Frontend (Next.js + Convex) — not started

See [`backend/README.md`](./backend/README.md) for backend setup and the detailed roadmap.

## What this is (and isn't)

This project targets **production-grade engineering patterns on demo-scale/synthetic data** — clean multi-agent orchestration, structured outputs, human-in-the-loop escalation, and auditable decision trails. It is **not** a certified, regulator-approved production insurance system: real-world deployment would additionally require regulatory compliance (IRDAI/HIPAA-equivalent), audited medical/fraud decisioning, legal review of auto-approval logic, and real claims data. The goal is a credible, end-to-end demonstration of how modern agentic AI systems are architected for this domain — not a drop-in replacement for insurer infrastructure.

## Repository layout

```
backend/              FastAPI + LangGraph backend (see backend/README.md)
insurance agent.txt    full product/architecture specification
projectfolder.txt      backend folder-structure planning doc
claimsence.png          architecture/design poster
```
