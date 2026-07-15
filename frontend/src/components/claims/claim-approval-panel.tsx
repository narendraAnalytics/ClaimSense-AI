"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { CheckCircle2, XCircle, PenLine, Loader2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { submitDecision, getReportUrl, parseResultsJson } from "@/lib/backend-api";

const DECISION_LABELS: Record<string, string> = {
  approve: "Low Risk – Recommended for Approval",
  need_review: "Medium Risk – Claims Officer Review",
  manual_investigation: "High Risk – Manual Investigation",
  siu_review: "Critical Risk – SIU Review",
  incomplete_documentation: "Incomplete Documentation – Additional Documents Required",
};

function StatCard({
  label,
  value,
  tone,
  dark,
}: {
  label: string;
  value: string;
  tone?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={
        dark
          ? "rounded-xl border border-white/10 bg-white/[.05] p-4"
          : "rounded-xl border border-emerald-500/15 bg-white/60 p-4"
      }
    >
      <p className={`text-[12.5px] font-medium ${dark ? "text-[#a9d9c9]" : "text-[#4c7d6e]"}`}>{label}</p>
      <p className={`mt-1 text-[19px] font-bold ${tone ?? (dark ? "text-[#eafff5]" : "text-[#0c2b24]")}`}>
        {value}
      </p>
    </div>
  );
}

export function ClaimApprovalPanel({
  claim,
  backendClaimId,
  variant = "card",
}: {
  claim: Doc<"claims">;
  backendClaimId: string;
  /** "card" = standalone light-theme card (default); "overlay" = dark theme, no outer card chrome, for embedding inside ProcessClaimOverlay. Purely presentational — same submitDecision/saveDecision calls either way. */
  variant?: "card" | "overlay";
}) {
  const dark = variant === "overlay";
  const saveDecision = useMutation(api.claims.saveDecision);
  const [submitting, setSubmitting] = useState<"approve" | "reject" | "modify" | null>(null);
  const [modifiedAmount, setModifiedAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (claim.status !== "awaiting_approval") return null;

  const results = parseResultsJson(claim.resultsJson);
  const settlement = results?.settlement_result as Record<string, unknown> | null | undefined;
  const decision = settlement?.approval_status as string | undefined;
  const decisionTone =
    decision === "approve"
      ? "text-emerald-600"
      : decision === "siu_review"
        ? "text-red-600"
        : decision === "manual_investigation"
          ? "text-orange-600"
          : decision === "incomplete_documentation"
            ? "text-slate-600"
            : "text-amber-600";

  async function handleDecision(decisionType: "approve" | "reject" | "modify") {
    setError(null);
    setSubmitting(decisionType);
    try {
      const amount =
        decisionType === "modify" && modifiedAmount ? Number(modifiedAmount) : undefined;
      const result = await submitDecision(backendClaimId, {
        decision: decisionType,
        modified_amount: amount,
        notes: notes || undefined,
      });
      await saveDecision({
        claimId: claim._id,
        officerDecision: decisionType,
        officerAmount: amount,
        officerNotes: notes || undefined,
        resultsJson: JSON.stringify(result),
        recommendedAmount:
          (result.settlement_result?.recommended_amount as number | undefined) ?? undefined,
        reportUrl: result.report_url ? getReportUrl(backendClaimId) : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit decision");
      setSubmitting(null);
    }
  }

  return (
    <div
      className={
        dark
          ? "flex flex-col gap-4"
          : "flex flex-col gap-4 rounded-2xl border border-amber-500/25 bg-amber-50/60 p-5 backdrop-blur-md"
      }
    >
      {!dark && (
        <h2 className="font-heading text-[19px] font-bold text-[#0c2b24]">
          Awaiting Claims Officer Decision
        </h2>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="AI Recommendation"
          value={decision ? (DECISION_LABELS[decision] ?? decision) : "—"}
          tone={decisionTone}
          dark={dark}
        />
        <StatCard
          label="Recommended Amount"
          value={
            settlement?.recommended_amount != null
              ? `₹${Number(settlement.recommended_amount).toLocaleString()}`
              : "—"
          }
          dark={dark}
        />
        <StatCard
          label="Fraud Score"
          value={claim.fraudScore !== undefined ? `${claim.fraudScore}/100` : "—"}
          tone={
            claim.fraudScore !== undefined && claim.fraudScore >= 50
              ? "text-red-600"
              : "text-emerald-600"
          }
          dark={dark}
        />
      </div>

      {settlement?.reasoning ? (
        <div
          className={
            dark
              ? "rounded-xl border border-white/10 bg-white/[.05] p-4"
              : "rounded-xl border border-emerald-500/15 bg-white/60 p-4"
          }
        >
          <p className={`text-[12.5px] font-medium ${dark ? "text-[#a9d9c9]" : "text-[#4c7d6e]"}`}>
            AI Reasoning
          </p>
          <p className={`mt-1 text-[14px] ${dark ? "text-[#d7f5e9]" : "text-[#1c4a3f]"}`}>
            {String(settlement.reasoning)}
          </p>
        </div>
      ) : null}

      <div
        className={
          dark
            ? "flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[.05] p-4"
            : "flex flex-col gap-3 rounded-xl border border-emerald-500/15 bg-white/60 p-4"
        }
      >
        <label
          className={`flex flex-col gap-1 text-[13.5px] font-medium ${dark ? "text-[#a9d9c9]" : "text-[#4c7d6e]"}`}
        >
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={
              dark
                ? "rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[14px] text-[#eafff5]"
                : "rounded-lg border border-emerald-500/20 bg-white px-3 py-2 text-[14px] text-[#0c2b24]"
            }
          />
        </label>
        <label
          className={`flex flex-col gap-1 text-[13.5px] font-medium ${dark ? "text-[#a9d9c9]" : "text-[#4c7d6e]"}`}
        >
          Modified amount (for Modify)
          <input
            type="number"
            value={modifiedAmount}
            onChange={(e) => setModifiedAmount(e.target.value)}
            className={
              dark
                ? "rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[14px] text-[#eafff5]"
                : "rounded-lg border border-emerald-500/20 bg-white px-3 py-2 text-[14px] text-[#0c2b24]"
            }
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => void handleDecision("approve")}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-[14.5px] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting === "approve" ? (
            <Loader2 className="h-[16px] w-[16px] animate-spin" />
          ) : (
            <CheckCircle2 className="h-[16px] w-[16px]" />
          )}
          Approve
        </button>
        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => void handleDecision("reject")}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-[14.5px] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting === "reject" ? (
            <Loader2 className="h-[16px] w-[16px] animate-spin" />
          ) : (
            <XCircle className="h-[16px] w-[16px]" />
          )}
          Reject
        </button>
        <button
          type="button"
          disabled={submitting !== null || !modifiedAmount}
          onClick={() => void handleDecision("modify")}
          className={
            dark
              ? "inline-flex items-center gap-2 rounded-full border-[1.5px] border-white/25 bg-white/[.06] px-5 py-2.5 text-[14.5px] font-semibold text-[#eafff5] transition-all disabled:cursor-not-allowed disabled:opacity-60"
              : "inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#0e8a6d]/40 bg-white/50 px-5 py-2.5 text-[14.5px] font-semibold text-[#0e8a6d] transition-all disabled:cursor-not-allowed disabled:opacity-60"
          }
        >
          {submitting === "modify" ? (
            <Loader2 className="h-[16px] w-[16px] animate-spin" />
          ) : (
            <PenLine className="h-[16px] w-[16px]" />
          )}
          Modify Amount
        </button>
      </div>

      {submitting !== null && (
        <div
          className={
            dark
              ? "flex items-center gap-2.5 rounded-xl border border-cyan-400/25 bg-cyan-400/[.08] px-4 py-3"
              : "flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-50/70 px-4 py-3"
          }
        >
          <Loader2 className={`h-[16px] w-[16px] flex-none animate-spin ${dark ? "text-cyan-300" : "text-[#0e8a6d]"}`} />
          <p className={`text-[13px] ${dark ? "text-cyan-100" : "text-[#0c2b24]"}`}>
            Processing your decision — generating the final report and PDF. This can take up to a
            minute. Keep this page open, the result and download link will appear here automatically.
          </p>
        </div>
      )}

      {error && <p className={`text-[13.5px] ${dark ? "text-red-300" : "text-red-600"}`}>{error}</p>}
    </div>
  );
}
