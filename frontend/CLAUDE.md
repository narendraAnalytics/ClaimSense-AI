@AGENTS.md

# frontend/ — CLAUDE.md

Guidance for Claude Code when working in this directory. See the repo-root `CLAUDE.md` for overall project context, `../insurance agent.txt` for the full product/architecture spec, and `../backend/CLAUDE.md` + `../projectfolder.txt` for backend implementation detail.

## What this is
**ClaimSense AI** is an AI-powered insurance claims intelligence platform: a 9-agent LangGraph backend ingests claim documents (policy PDFs, medical records, hospital bills, etc.) and produces a decision-ready package — coverage validation, medical/billing validation, fraud risk score, similar-claim context, a settlement recommendation, and an adjuster-ready PDF report. This `frontend/` directory is the Next.js app that end users (claimants/adjusters) interact with; it talks to the already-built backend over HTTP.

## Deployments
Both halves are now live and can be wired together:
- **Frontend** (this app) — Vercel: `https://claimsense-ai-rust.vercel.app/`
- **Backend** — Railway: `https://claimsense-ai-production.up.railway.app`, all endpoints under `/api/v1` (e.g. `GET /api/v1/health`)

## Backend API surface to build against
The backend's 9-agent pipeline is functionally complete and live-verified (real Sarvam OCR/reasoning calls, real Qdrant Cloud search, real PDF generation). Relevant endpoints:
- `POST /api/v1/claims` — create a claim
- `POST /api/v1/claims/{claim_id}/upload` — upload a document (policy PDF, discharge summary, prescription, lab report, hospital bill, etc.)
- `POST /api/v1/claims/{claim_id}/process` — runs the full 9-agent pipeline synchronously; returns coverage decision, medical validation, computed payable amount, 0-100 fraud score, similar-claim context, an approve/reject/need-review settlement recommendation, and a `report_url`
- `GET /api/v1/claims/{claim_id}/report` — downloads the generated adjuster-ready PDF
- `GET /api/v1/health`

Important caveats when building UI around these:
- `/process` is slow (OCR + 4 real LLM calls) and has **no checkpointing yet** — calling it again on the same claim re-runs the entire pipeline from scratch and re-spends real Sarvam API credits. Treat it as a single long-running action in the UI (e.g. disable re-submit, show progress), not something to poll/retry casually.
- **No auth on any endpoint currently** — anyone with a `claim_id` can call these, including the report download. Don't assume the backend enforces access control; that's frontend-phase work (see below).

## What's deliberately deferred to this (frontend) phase
These aren't oversights — the backend `CLAUDE.md`/`projectfolder.txt` explicitly queue them for once this frontend exists:
- **Convex Auth** — ✅ done. `@convex-dev/auth` is wired up against the existing prod Convex deployment (`ceaseless-sparrow-692`, the same one `backend/.env` points at — there's no separate dev deployment for this project). Password (email/password) and Google OAuth providers are both live (`convex/auth.ts`). `convex/schema.ts` has `authTables`, `convex/http.ts` registers Convex Auth's HTTP routes, `convex/auth.config.ts` configures the JWT domain. `JWT_PRIVATE_KEY`/`JWKS`/`SITE_URL`/`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are set as Convex deployment env vars (not in any `.env` file — set via `npx convex env set`). `SITE_URL` is currently `https://claimsense-ai-rust.vercel.app` (the deployed site) — Google sign-in **will not work from `localhost` right now**; flip `SITE_URL` back to `http://localhost:3000` temporarily to test Google OAuth locally (Password sign-in is unaffected either way, since it doesn't use `SITE_URL`). `src/app/layout.tsx` wraps the app in `ConvexAuthNextjsServerProvider` + `ConvexClientProvider` (`src/components/providers/convex-client-provider.tsx`); `middleware.ts` runs `convexAuthNextjsMiddleware()` with a broad matcher but no forced redirects yet, since there is no protected route to gate. `src/app/sign-in/page.tsx` + `src/components/auth/sign-in-form.tsx` render the sign-in/sign-up UI; the header's "Request Demo" (`site-header.tsx`) and hero's "Start Free Trial" (`hero-section.tsx`) CTAs link to `/sign-in`; the header shows an avatar (Google profile picture, or an initial-letter fallback for Password users) plus "Welcome, {name}" once authenticated, and clicking the avatar signs out.

  **New Password sign-ups are routed to `/username`** (`src/app/username/page.tsx` + `src/components/auth/username-form.tsx`) to set a display name (and optional phone, written to the `users` table's existing `phone` column) before reaching `/` — enforced by a `UsernameGate` client component inside `convex-client-provider.tsx` that redirects whenever `useQuery(api.users.current)` has no `name` yet. Google sign-ins already have a `name` from their OAuth profile and skip this step. `convex/users.ts` has the `current` query and `setProfile` mutation backing this.

  **No dashboard or protected route exists yet** — signing in currently just returns the user to `/`; gating upload/process/report access is still future work.

## Convex operational notes (learned the hard way this session)
- **No local Convex login for this project** — `mcp__convex__*` MCP tools always fail with "Not Authorized" here (no cached `convex.json` deployment selector). Use the CLI directly instead: `CONVEX_DEPLOY_KEY=$(grep CONVEX_DEPLOY_KEY .env | cut -d= -f2-) npx convex dev --once` pushes schema/functions to the existing prod deployment non-interactively — no `npx convex login` needed or possible in this environment.
- **Reading logs/data**: `npx convex logs` streams forever (no `--once`); wrap it in `timeout 15 npx convex logs --history 500 --jsonl` for a bounded read. `npx convex data <tableName>` (e.g. `authAccounts`, `users`) is the read-only way to inspect rows without a dashboard.
- **Deleting a test user must clear all four Convex Auth tables**, not just `users` — `authAccounts`, `authSessions`, and `authRefreshTokens` all reference `users` by ID. Deleting only the `users` row leaves an orphaned `authAccounts` row that makes every future sign-in with that same provider account throw `Uncaught Error: ... Update on nonexistent document ID` inside the `/api/auth/callback/*` HTTP action — this fails silently from the browser's perspective (redirects back to the app with no session, no error banner) and **never appears in Vercel logs** since it happens on Convex's side, not in Next.js. Only `npx convex logs` surfaces it.
- **Importing the generated Convex API from `src/`**: `convex/` lives at `frontend/` root (sibling to `src/`), not under the `@/*` tsconfig alias (`./src/*`). Import as a relative path, e.g. `../../../convex/_generated/api` from `src/components/auth/`.
- **Convex persistence** — claim/document state on the backend lives in in-memory Python dicts and resets on server restart; Convex tables are the planned replacement (only `authTables` exist in `convex/schema.ts` so far, no claim/document tables yet).
- **LangGraph checkpointing** — deliberately deferred to be Convex-backed (not a throwaway SQLite/Postgres checkpointer) once Convex Auth/tables exist. Convex Auth now exists; checkpointing itself is still unbuilt.
- **UploadThing** — file storage; the backend currently saves uploads to local disk. UploadThing wiring was deliberately deferred until this frontend existed.

## Frontend stack (as scaffolded)
Next.js 16 (App Router, `src/app/`), React 19, Tailwind v4, shadcn (`components.json`) / `@base-ui/react`, `motion`, `next-themes`, `lucide-react`. See `AGENTS.md` above — Next.js 16 has breaking changes from training-data-era Next.js; check `node_modules/next/dist/docs/` before assuming an API.

Currently built: the marketing landing page (`src/app/page.tsx`, `src/components/landing/` — `hero-section`, `pipeline-showcase`, `trust-bar`, `site-header`, `aurora-background`, `animated-counter`) plus a full auth flow — sign-in/sign-up (`/sign-in`), a post-signup username step (`/username`), and Convex Auth (Password + Google) wired through the whole app. No claim submission flow or dashboard yet.

## What's next for the frontend
- Claim submission flow: create claim → upload documents → trigger `/process` → display results
- Adjuster dashboard to view a claim's coverage/medical/billing/fraud/settlement results and download its report (the hero/header currently have no "Dashboard" destination for signed-in users — deferred pending this)
- Convex schema/tables for claim + document persistence, replacing the backend's in-memory registries
- Gate upload/process/report access behind Convex Auth now that it exists
