"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, PlayCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { processClaim, getReportUrl } from "@/lib/backend-api";

const PROGRESS_STEPS = [
  "Extracting documents…",
  "Running OCR…",
  "Policy validation…",
  "Medical validation…",
  "Billing & fraud detection…",
  "Settlement recommendation…",
  "Generating report…",
];

export function ProcessClaimButton({
  claimId,
  backendClaimId,
}: {
  claimId: Id<"claims">;
  backendClaimId: string;
}) {
  const documents = useQuery(api.documents.listByClaim, { claimId });
  const updateStatus = useMutation(api.claims.updateStatus);
  const saveResults = useMutation(api.claims.saveResults);
  const [processing, setProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const canProcess = (documents?.length ?? 0) > 0 && !processing;

  async function handleProcess() {
    setError(null);
    setProcessing(true);
    setStepIndex(0);
    await updateStatus({ claimId, status: "processing" });

    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, PROGRESS_STEPS.length - 1));
    }, 4000);

    try {
      const result = await processClaim(backendClaimId);
      await saveResults({
        claimId,
        status: result.errors.length > 0 && !result.settlement_result ? "failed" : "completed",
        resultsJson: JSON.stringify(result),
        recommendedAmount:
          (result.settlement_result?.recommended_amount as number | undefined) ?? undefined,
        fraudScore: (result.fraud_result?.fraud_score as number | undefined) ?? undefined,
        settlementDecision:
          (result.settlement_result?.approval_status as string | undefined) ?? undefined,
        reportUrl: result.report_url ? getReportUrl(backendClaimId) : undefined,
      });
    } catch (err) {
      await saveResults({
        claimId,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Processing failed",
      });
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      clearInterval(interval);
      setProcessing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-white/70 p-5 backdrop-blur-md">
      <button
        type="button"
        disabled={!canProcess}
        onClick={() => void handleProcess()}
        className="inline-flex items-center gap-2.5 rounded-full bg-[linear-gradient(110deg,#0ea77a,#0ab6c4_45%,#0ea77a_90%)] bg-[length:250%_auto] px-6 py-3 text-[15.5px] font-bold text-white shadow-[0_12px_34px_rgba(14,167,122,.42)] transition-all disabled:cursor-not-allowed disabled:opacity-60"
      >
        {processing ? (
          <Loader2 className="h-[16px] w-[16px] animate-spin" />
        ) : (
          <PlayCircle className="h-[16px] w-[16px]" />
        )}
        {processing ? "Processing…" : "Process Claim"}
      </button>

      {processing && (
        <p className="mt-3 text-[14px] text-[#4c7d6e]">{PROGRESS_STEPS[stepIndex]}</p>
      )}
      {!processing && (documents?.length ?? 0) === 0 && (
        <p className="mt-3 text-[13.5px] text-[#4c7d6e]">
          Upload at least one document before processing.
        </p>
      )}
      {error && <p className="mt-3 text-[13.5px] text-red-600">{error}</p>}
    </div>
  );
}
