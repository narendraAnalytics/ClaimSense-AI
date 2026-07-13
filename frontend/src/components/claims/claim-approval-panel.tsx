"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { CheckCircle2, XCircle, PenLine, Loader2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { submitDecision, getReportUrl, type ProcessClaimResponse } from "@/lib/backend-api";

const DECISION_LABELS: Record<string, string> = {
  approve: "Approved",
  reject: "High Risk – Manual Review Required",
  need_review: "Manual Review Required",
};

function StatCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/15 bg-white/60 p-4">
      <p className="text-[12.5px] font-medium text-[#4c7d6e]">{label}</p>
      <p className={`mt-1 text-[19px] font-bold ${tone ?? "text-[#0c2b24]"}`}>{value}</p>
    </div>
  );
}

export function ClaimApprovalPanel({
  claim,
  backendClaimId,
}: {
  claim: Doc<"claims">;
  backendClaimId: string;
}) {
  const saveDecision = useMutation(api.claims.saveDecision);
  const [submitting, setSubmitting] = useState<"approve" | "reject" | "modify" | null>(null);
  const [modifiedAmount, setModifiedAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (claim.status !== "awaiting_approval") return null;

  const results: ProcessClaimResponse | null = claim.resultsJson
    ? JSON.parse(claim.resultsJson)
    : null;
  const settlement = results?.settlement_result as Record<string, unknown> | null | undefined;
  const decision = settlement?.approval_status as string | undefined;
  const decisionTone =
    decision === "approve" ? "text-emerald-600" : decision === "reject" ? "text-red-600" : "text-amber-600";

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
    <div className="flex flex-col gap-4 rounded-2xl border border-amber-500/25 bg-amber-50/60 p-5 backdrop-blur-md">
      <h2 className="font-heading text-[19px] font-bold text-[#0c2b24]">
        Awaiting Claims Officer Decision
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="AI Recommendation"
          value={decision ? (DECISION_LABELS[decision] ?? decision) : "—"}
          tone={decisionTone}
        />
        <StatCard
          label="Recommended Amount"
          value={
            settlement?.recommended_amount != null
              ? `₹${Number(settlement.recommended_amount).toLocaleString()}`
              : "—"
          }
        />
        <StatCard
          label="Fraud Score"
          value={claim.fraudScore !== undefined ? `${claim.fraudScore}/100` : "—"}
          tone={
            claim.fraudScore !== undefined && claim.fraudScore >= 50
              ? "text-red-600"
              : "text-emerald-600"
          }
        />
      </div>

      {settlement?.reasoning ? (
        <div className="rounded-xl border border-emerald-500/15 bg-white/60 p-4">
          <p className="text-[12.5px] font-medium text-[#4c7d6e]">AI Reasoning</p>
          <p className="mt-1 text-[14px] text-[#1c4a3f]">{String(settlement.reasoning)}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/15 bg-white/60 p-4">
        <label className="flex flex-col gap-1 text-[13.5px] font-medium text-[#4c7d6e]">
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="rounded-lg border border-emerald-500/20 bg-white px-3 py-2 text-[14px] text-[#0c2b24]"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13.5px] font-medium text-[#4c7d6e]">
          Modified amount (for Modify)
          <input
            type="number"
            value={modifiedAmount}
            onChange={(e) => setModifiedAmount(e.target.value)}
            className="rounded-lg border border-emerald-500/20 bg-white px-3 py-2 text-[14px] text-[#0c2b24]"
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
          className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#0e8a6d]/40 bg-white/50 px-5 py-2.5 text-[14.5px] font-semibold text-[#0e8a6d] transition-all disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting === "modify" ? (
            <Loader2 className="h-[16px] w-[16px] animate-spin" />
          ) : (
            <PenLine className="h-[16px] w-[16px]" />
          )}
          Modify Amount
        </button>
      </div>

      {error && <p className="text-[13.5px] text-red-600">{error}</p>}
    </div>
  );
}
