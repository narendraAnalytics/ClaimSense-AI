"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, PlayCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { processClaim, getReportUrl } from "@/lib/backend-api";

// Purely a UI animation layered over the one real /process call, since the
// backend has no per-agent streaming yet (see frontend/pdffile.txt). Cycles
// while waiting and simply stops (interval cleared) the moment the real
// response arrives — it never claims completion ahead of reality.
const AGENT_STEPS = [
  "Document Intelligence",
  "Intake Supervisor",
  "Policy Coverage",
  "Medical Validation",
  "Billing · Fraud · Historical Similarity",
  "Settlement Recommendation",
  "Report Generation",
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canProcess = (documents?.length ?? 0) > 0 && !processing;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleProcess() {
    setError(null);
    setProcessing(true);
    setStepIndex(0);
    await updateStatus({ claimId, status: "processing" });

    intervalRef.current = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, AGENT_STEPS.length - 1));
    }, 2200);

    try {
      const result = await processClaim(backendClaimId);

      if (result.status === "awaiting_approval") {
        await saveResults({
          claimId,
          status: "awaiting_approval",
          resultsJson: JSON.stringify(result),
          recommendedAmount:
            (result.settlement_result?.recommended_amount as number | undefined) ?? undefined,
          fraudScore: (result.fraud_result?.fraud_score as number | undefined) ?? undefined,
          settlementDecision:
            (result.settlement_result?.approval_status as string | undefined) ?? undefined,
        });
      } else {
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
      }
    } catch (err) {
      await saveResults({
        claimId,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Processing failed",
      });
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      if (intervalRef.current) clearInterval(intervalRef.current);
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
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-emerald-500/15 bg-white/60 px-4 py-2.5">
          <Loader2 className="h-[15px] w-[15px] flex-none animate-spin text-[#0e8a6d]" />
          <p key={stepIndex} className="text-[13.5px] font-medium text-[#0c2b24] transition-opacity">
            Running {AGENT_STEPS[stepIndex]}…
          </p>
        </div>
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
