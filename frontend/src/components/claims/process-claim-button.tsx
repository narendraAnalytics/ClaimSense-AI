"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, PlayCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { processClaim, getReportUrl } from "@/lib/backend-api";
import { ProcessClaimOverlay, type OverlayStepKey } from "./process-claim-overlay";

// Simulated Phase A timing (document -> settlement) — purely a UI animation
// layered over the one real /process call, since the backend has no
// per-agent streaming yet (see frontend/pdffile.txt). Holds at "settlement"
// (last entry has no timeout) until the real response arrives, so the
// animation can never claim completion ahead of reality.
const PHASE_A_ORDER: OverlayStepKey[] = [
  "document",
  "supervisor",
  "policy",
  "medical",
  "parallel",
  "settlement",
];
const PHASE_A_DURATIONS = [1900, 900, 1900, 1900, 2400];

export function ProcessClaimButton({
  claimId,
  backendClaimId,
  claim,
  onOverlayOpenChange,
}: {
  claimId: Id<"claims">;
  backendClaimId: string;
  claim: Doc<"claims">;
  onOverlayOpenChange?: (open: boolean) => void;
}) {
  const documents = useQuery(api.documents.listByClaim, { claimId });
  const updateStatus = useMutation(api.claims.updateStatus);
  const saveResults = useMutation(api.claims.saveResults);
  const [processing, setProcessing] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [stepKey, setStepKey] = useState<OverlayStepKey>("document");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canProcess = (documents?.length ?? 0) > 0 && !processing;

  useEffect(() => {
    onOverlayOpenChange?.(overlayOpen);
  }, [overlayOpen, onOverlayOpenChange]);

  // Once the officer's decision lands (claim.status flips away from
  // "awaiting_approval" to "completed" via the existing saveDecision
  // mutation inside ClaimApprovalPanel), advance the overlay's visual
  // timeline through Report Generation to the success screen. Purely
  // reacting to real Convex state — no new mutation calls here.
  useEffect(() => {
    if (stepKey !== "human_approval" || claim.status !== "completed") return;
    setStepKey("report");
    const t = setTimeout(() => setStepKey("done"), 1200);
    return () => clearTimeout(t);
  }, [claim.status, stepKey]);

  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function runSimulatedPhaseA() {
    let i = 0;
    const step = () => {
      if (i >= PHASE_A_DURATIONS.length) return; // hold at "settlement"
      timerRef.current = setTimeout(() => {
        i += 1;
        setStepKey(PHASE_A_ORDER[i]);
        step();
      }, PHASE_A_DURATIONS[i]);
    };
    step();
  }

  async function handleProcess() {
    setError(null);
    setProcessing(true);
    setOverlayOpen(true);
    setStepKey("document");
    clearTimer();
    await updateStatus({ claimId, status: "processing" });
    runSimulatedPhaseA();

    try {
      const result = await processClaim(backendClaimId);
      clearTimer();

      if (result.status === "awaiting_approval") {
        setStepKey("human_approval");
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
        const failed = result.errors.length > 0 && !result.settlement_result;
        setStepKey(failed ? "failed" : "report");
        if (!failed) {
          setTimeout(() => setStepKey("done"), 1200);
        }
        await saveResults({
          claimId,
          status: failed ? "failed" : "completed",
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
      clearTimer();
      const message = err instanceof Error ? err.message : "Processing failed";
      setStepKey("failed");
      setError(message);
      await saveResults({
        claimId,
        status: "failed",
        errorMessage: message,
      });
    } finally {
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

      {!processing && (documents?.length ?? 0) === 0 && (
        <p className="mt-3 text-[13.5px] text-[#4c7d6e]">
          Upload at least one document before processing.
        </p>
      )}
      {error && !overlayOpen && <p className="mt-3 text-[13.5px] text-red-600">{error}</p>}

      <ProcessClaimOverlay
        open={overlayOpen}
        stepKey={stepKey}
        errorMessage={error}
        claim={claim}
        backendClaimId={backendClaimId}
        onClose={() => setOverlayOpen(false)}
      />
    </div>
  );
}
