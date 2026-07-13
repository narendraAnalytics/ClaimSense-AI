"use client";

import { Download } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { ProcessClaimResponse } from "@/lib/backend-api";

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

export function ClaimResults({ claim }: { claim: Doc<"claims"> }) {
  if (claim.status !== "completed" && claim.status !== "failed") return null;

  if (claim.status === "failed") {
    return (
      <div className="rounded-2xl border border-red-500/25 bg-red-50/70 p-5">
        <p className="text-[14.5px] font-semibold text-red-700">Processing failed</p>
        {claim.errorMessage && (
          <p className="mt-1 text-[13.5px] text-red-600">{claim.errorMessage}</p>
        )}
      </div>
    );
  }

  const results: ProcessClaimResponse | null = claim.resultsJson
    ? JSON.parse(claim.resultsJson)
    : null;

  const decisionTone =
    claim.settlementDecision === "approve"
      ? "text-emerald-600"
      : claim.settlementDecision === "reject"
        ? "text-red-600"
        : "text-amber-600";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-emerald-500/20 bg-white/70 p-5 backdrop-blur-md">
      <h2 className="font-heading text-[19px] font-bold text-[#0c2b24]">AI Results</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Settlement Decision"
          value={
            claim.settlementDecision
              ? (DECISION_LABELS[claim.settlementDecision] ?? claim.settlementDecision)
              : "—"
          }
          tone={decisionTone}
        />
        <StatCard
          label="Recommended Amount"
          value={
            claim.recommendedAmount !== undefined
              ? `₹${claim.recommendedAmount.toLocaleString()}`
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

      {results?.settlement_result?.reasoning ? (
        <div className="rounded-xl border border-emerald-500/15 bg-white/60 p-4">
          <p className="text-[12.5px] font-medium text-[#4c7d6e]">Settlement Reasoning</p>
          <p className="mt-1 text-[14px] text-[#1c4a3f]">
            {String(results.settlement_result.reasoning)}
          </p>
        </div>
      ) : null}

      {claim.reportUrl && (
        <a
          href={claim.reportUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-full border-[1.5px] border-[#0e8a6d]/40 bg-white/50 px-5 py-2.5 text-[14.5px] font-semibold text-[#0e8a6d] transition-all hover:border-[#0e8a6d] hover:bg-emerald-500/10"
        >
          <Download className="h-[16px] w-[16px]" />
          Download Report
        </a>
      )}
    </div>
  );
}
