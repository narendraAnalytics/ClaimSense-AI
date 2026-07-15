"use client";

import { useEffect } from "react";
import {
  X,
  ScanText,
  Bot,
  ShieldCheck,
  Stethoscope,
  Split,
  Target,
  UserCheck,
  FileCheck2,
  CheckCheck,
  Receipt,
  ShieldAlert,
  Network,
  Loader2,
  CircleCheck,
  Circle,
  TriangleAlert,
  Download,
} from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { parseResultsJson } from "@/lib/backend-api";
import { ClaimApprovalPanel } from "./claim-approval-panel";

const DECISION_LABELS: Record<string, string> = {
  approve: "Approved",
  reject: "High Risk – Manual Review Required",
  need_review: "Manual Review Required",
};

export type OverlayStepKey =
  | "document"
  | "supervisor"
  | "policy"
  | "medical"
  | "parallel"
  | "settlement"
  | "human_approval"
  | "report"
  | "done"
  | "failed";

const SEQUENTIAL_STEPS: {
  key: OverlayStepKey;
  name: string;
  tag: string;
  desc: string;
  icon: typeof ScanText;
}[] = [
  {
    key: "document",
    name: "Document Intelligence",
    tag: "Sarvam Vision · OCR",
    desc: "OCRs every uploaded file — creates a job, uploads, polls, downloads and parses each page into structured text and tables.",
    icon: ScanText,
  },
  {
    key: "supervisor",
    name: "Intake Supervisor",
    tag: "Deterministic",
    desc: "Routes the claim and tracks workflow progress. No model call — effectively instant.",
    icon: Bot,
  },
  {
    key: "policy",
    name: "Policy Coverage",
    tag: "Sarvam-30B",
    desc: "Reads the OCR'd policy document, reasons about coverage, and extracts deductible & copay.",
    icon: ShieldCheck,
  },
  {
    key: "medical",
    name: "Medical Validation",
    tag: "Sarvam-30B",
    desc: "Validates diagnosis and treatment consistency across discharge summary, prescriptions and lab reports.",
    icon: Stethoscope,
  },
];

const STAGE_ORDER: OverlayStepKey[] = [
  "document",
  "supervisor",
  "policy",
  "medical",
  "parallel",
  "settlement",
  "human_approval",
  "report",
  "done",
];

const PARALLEL_CARDS = [
  { name: "Billing Validation", icon: Receipt, color: "text-amber-400", bar: "bg-amber-400" },
  { name: "Fraud Detection", icon: ShieldAlert, color: "text-pink-400", bar: "bg-pink-400" },
  { name: "Historical Similarity", icon: Network, color: "text-lime-400", bar: "bg-lime-400" },
];

function stageState(order: OverlayStepKey[], key: OverlayStepKey, currentIdx: number) {
  const idx = order.indexOf(key);
  if (currentIdx > idx) return "done" as const;
  if (currentIdx === idx) return "active" as const;
  return "pending" as const;
}

function Dot({
  state,
  icon: Icon,
  pulseColor = "border-cyan-400",
}: {
  state: "done" | "active" | "pending";
  icon: typeof ScanText;
  pulseColor?: string;
}) {
  const base =
    "relative flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] transition-all";
  if (state === "done") {
    return (
      <span
        className={`${base} border-transparent bg-[linear-gradient(135deg,#10b981,#06b6d4)] text-[#062a1f] shadow-[0_6px_16px_rgba(16,185,129,.4)]`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span
        className={`${base} border-cyan-400 bg-white/[.08] text-cyan-300 shadow-[0_0_22px_rgba(34,211,238,.4)]`}
      >
        <span
          className={`absolute -inset-1 rounded-full border-2 ${pulseColor} opacity-60 motion-safe:animate-ping motion-reduce:hidden`}
        />
        <Icon className="h-[18px] w-[18px]" />
      </span>
    );
  }
  return (
    <span className={`${base} border-white/15 bg-white/5 text-[#5b8578]`}>
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

function Line({ done }: { done: boolean }) {
  return (
    <span
      className={`my-[3px] w-[2px] flex-1 min-h-[26px] rounded-full transition-colors ${
        done ? "bg-[linear-gradient(180deg,#10b981,#06b6d4)]" : "bg-white/10"
      }`}
    />
  );
}

export function ProcessClaimOverlay({
  open,
  stepKey,
  errorMessage,
  claim,
  backendClaimId,
  onClose,
}: {
  open: boolean;
  stepKey: OverlayStepKey;
  errorMessage?: string | null;
  claim: Doc<"claims">;
  backendClaimId: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const currentIdx = STAGE_ORDER.indexOf(stepKey);
  const failed = stepKey === "failed";

  let phaseLabel = "Phase A · Automated processing";
  if (stepKey === "human_approval") phaseLabel = "Phase B · Awaiting human decision";
  if (stepKey === "report") phaseLabel = "Phase B · Finalizing";
  if (stepKey === "done") phaseLabel = "Complete";
  if (failed) phaseLabel = "Processing failed";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_30%_20%,rgba(4,40,32,.92),rgba(3,26,22,.97))] p-[26px] backdrop-blur-[6px]"
    >
      <div className="relative w-full max-w-[980px] max-h-[92vh] overflow-y-auto rounded-[26px] border border-white/[.14] bg-[linear-gradient(165deg,rgba(255,255,255,.09),rgba(255,255,255,.03))] p-[30px] pb-[26px] shadow-[0_40px_120px_rgba(0,0,0,.5)] backdrop-blur-[30px]">
        <div className="mb-1.5 flex items-center gap-3">
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[linear-gradient(135deg,#10b981,#06b6d4)] shadow-[0_8px_20px_rgba(16,185,129,.4)]">
            {failed ? (
              <TriangleAlert className="h-[19px] w-[19px] text-white" />
            ) : (
              <Split className="h-[19px] w-[19px] text-white" />
            )}
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-[19px] font-bold text-[#f0fff8]">
              {claim.claimNumber} · Multi-agent pipeline
            </span>
            <span className="text-[12.5px] text-[#8fd9c4]">{phaseLabel}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-[11px] border border-white/[.16] bg-white/[.06] text-[#cdf5e6] transition-colors hover:bg-white/[.14]"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {failed ? (
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <TriangleAlert className="h-6 w-6 flex-none text-red-400" />
            <div className="flex flex-col gap-1">
              <span className="text-[14.5px] font-bold text-red-100">Claim processing failed</span>
              <span className="text-[12.5px] text-red-200/80">
                {errorMessage ?? "An unexpected error occurred."}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-full bg-white/10 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/20"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mt-[22px] flex flex-col">
              {SEQUENTIAL_STEPS.map((stg) => {
                const state = stageState(STAGE_ORDER, stg.key, currentIdx);
                const Icon = stg.icon;
                return (
                  <div key={stg.key} className="flex gap-4">
                    <div className="flex flex-none flex-col items-center">
                      <Dot state={state} icon={Icon} />
                      <Line done={state === "done"} />
                    </div>
                    <div className="min-w-0 flex-1 pb-[22px]">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`text-[15px] font-bold ${state === "pending" ? "text-[#7fa697]" : "text-[#eafff5]"}`}
                        >
                          {stg.name}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[.08] px-2.5 py-0.5 text-[11px] text-[#9fe6cf]">
                          {stg.tag}
                        </span>
                      </div>
                      <p className="mt-1 max-w-[640px] text-[13px] leading-[1.55] text-[#a9d9c9]">
                        {stg.desc}
                      </p>
                      {state === "active" && (
                        <div className="mt-2.5 h-[5px] w-[220px] overflow-hidden rounded-full bg-white/[.08]">
                          <div className="h-full w-[70%] rounded-full bg-[linear-gradient(90deg,#10b981,#22d3ee)] transition-[width] duration-500" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* parallel group */}
              {(() => {
                const state = stageState(STAGE_ORDER, "parallel", currentIdx);
                return (
                  <div className="flex gap-4">
                    <div className="flex flex-none flex-col items-center">
                      <Dot state={state} icon={Split} pulseColor="border-cyan-400" />
                      <Line done={state === "done"} />
                    </div>
                    <div className="min-w-0 flex-1 pb-[22px]">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[15px] font-bold ${state === "pending" ? "text-[#7fa697]" : "text-[#eafff5]"}`}
                        >
                          Billing · Fraud · Historical Similarity
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[.08] px-2.5 py-0.5 text-[11px] text-[#9fe6cf]">
                          Parallel execution
                        </span>
                      </div>
                      <p className="mb-3 mt-1 text-[13px] text-[#a9d9c9]">
                        Three agents run simultaneously — the graph waits for the slowest to finish.
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {PARALLEL_CARDS.map((pc) => {
                          const PcIcon = pc.icon;
                          const StateIcon =
                            state === "done" ? CircleCheck : state === "active" ? Loader2 : Circle;
                          return (
                            <div
                              key={pc.name}
                              className="flex flex-col gap-1.5 rounded-[14px] border border-white/10 bg-white/[.04] p-3"
                            >
                              <div className="flex items-center gap-2">
                                <PcIcon className={`h-[15px] w-[15px] ${pc.color}`} />
                                <span className="text-[12px] font-bold text-[#eafff5]">{pc.name}</span>
                                <StateIcon
                                  className={`ml-auto h-[13px] w-[13px] ${pc.color} ${
                                    state === "active" ? "animate-spin" : ""
                                  }`}
                                />
                              </div>
                              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className={`h-full rounded-full transition-[width] duration-500 ${pc.bar} ${
                                    state === "done" ? "w-full" : state === "active" ? "w-[65%]" : "w-0"
                                  }`}
                                />
                              </div>
                              <span className="text-[10.5px] text-[#9fc9bb]">
                                {state === "done" ? "Complete" : state === "active" ? "Running…" : "Queued"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* settlement */}
              {(() => {
                const state = stageState(STAGE_ORDER, "settlement", currentIdx);
                const settlement = parseResultsJson(claim.resultsJson)?.settlement_result as
                  | Record<string, unknown>
                  | null
                  | undefined;
                return (
                  <div className="flex gap-4">
                    <div className="flex flex-none flex-col items-center">
                      <Dot state={state} icon={Target} />
                      <Line done={state === "done"} />
                    </div>
                    <div className="min-w-0 flex-1 pb-[22px]">
                      <span
                        className={`text-[15px] font-bold ${state === "pending" ? "text-[#7fa697]" : "text-[#eafff5]"}`}
                      >
                        Settlement Recommendation
                      </span>
                      <p className="mt-1 text-[13px] text-[#a9d9c9]">
                        Deterministic rule cascade combines every agent's findings into a payable amount.
                      </p>
                      {state === "done" && settlement && (
                        <div className="mt-2.5 inline-flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[.14] px-3.5 py-2">
                          <CircleCheck className="h-4 w-4 text-emerald-400" />
                          <span className="text-[12.5px] font-semibold text-emerald-50">
                            Recommended:{" "}
                            {settlement.recommended_amount != null
                              ? `₹${Number(settlement.recommended_amount).toLocaleString()}`
                              : "n/a"}{" "}
                            · fraud risk {(claim.fraudScore ?? "n/a").toString()}/100
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* human approval */}
              {(() => {
                const state = stageState(STAGE_ORDER, "human_approval", currentIdx);
                return (
                  <div className="flex gap-4">
                    <div className="flex flex-none flex-col items-center">
                      <Dot state={state} icon={UserCheck} pulseColor="border-pink-400" />
                      <Line done={state === "done"} />
                    </div>
                    <div className="min-w-0 flex-1 pb-[22px]">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[15px] font-bold ${state === "pending" ? "text-[#7fa697]" : "text-[#eafff5]"}`}
                        >
                          Human Approval
                        </span>
                        <span className="rounded-full border border-pink-400/30 bg-pink-400/[.16] px-2.5 py-0.5 text-[11px] text-pink-300">
                          Pipeline pauses here
                        </span>
                      </div>
                      {state === "active" && (
                        <div className="mt-3">
                          <p className="mb-3 text-[13px] text-pink-100/80">
                            The graph is genuinely paused — not a timer. Review and decide below.
                          </p>
                          <ClaimApprovalPanel claim={claim} backendClaimId={backendClaimId} variant="overlay" />
                        </div>
                      )}
                      {state === "done" && (
                        <div className="mt-2.5 inline-flex items-center gap-2.5 rounded-xl border border-pink-400/28 bg-pink-400/[.12] px-3.5 py-2">
                          <CheckCheck className="h-4 w-4 text-pink-400" />
                          <span className="text-[12.5px] font-semibold text-pink-100">
                            Decision recorded — resuming graph
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* report */}
              {(() => {
                const state = stageState(STAGE_ORDER, "report", currentIdx);
                return (
                  <div className="flex gap-4">
                    <div className="flex flex-none flex-col items-center">
                      <Dot state={state} icon={FileCheck2} />
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <span
                        className={`text-[15px] font-bold ${state === "pending" ? "text-[#7fa697]" : "text-[#eafff5]"}`}
                      >
                        Report Generation
                      </span>
                      <p className="mt-1 text-[13px] text-[#a9d9c9]">
                        Builds the adjuster-ready PDF and indexes the claim for future similarity search.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {stepKey === "done" && (
              <div className="mt-1.5 flex flex-col gap-3.5 rounded-2xl border border-emerald-400/35 bg-[linear-gradient(120deg,rgba(52,211,153,.16),rgba(34,211,238,.12))] p-4">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[13px] bg-[linear-gradient(135deg,#10b981,#06b6d4)] shadow-[0_8px_22px_rgba(16,185,129,.45)]">
                    <CheckCheck className="h-[21px] w-[21px] text-white" />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14.5px] font-bold text-[#ecfff6]">
                      Claim processed successfully
                    </span>
                    <span className="text-[12.5px] text-[#a9d9c9]">
                      Adjuster report ready · {claim.claimNumber} indexed for future similarity search
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="ml-auto rounded-full bg-[linear-gradient(110deg,#34d399,#22d3ee)] px-[18px] py-2.5 text-[13px] font-bold text-[#062a1f]"
                  >
                    View Results
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/[.06] p-3">
                    <p className="text-[11.5px] font-medium text-[#a9d9c9]">Settlement Decision</p>
                    <p
                      className={`mt-1 text-[16px] font-bold ${
                        claim.settlementDecision === "approve"
                          ? "text-emerald-300"
                          : claim.settlementDecision === "reject"
                            ? "text-red-300"
                            : "text-amber-300"
                      }`}
                    >
                      {claim.settlementDecision
                        ? (DECISION_LABELS[claim.settlementDecision] ?? claim.settlementDecision)
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[.06] p-3">
                    <p className="text-[11.5px] font-medium text-[#a9d9c9]">Recommended Amount</p>
                    <p className="mt-1 text-[16px] font-bold text-[#eafff5]">
                      {claim.recommendedAmount !== undefined
                        ? `₹${claim.recommendedAmount.toLocaleString()}`
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[.06] p-3">
                    <p className="text-[11.5px] font-medium text-[#a9d9c9]">Fraud Score</p>
                    <p
                      className={`mt-1 text-[16px] font-bold ${
                        claim.fraudScore !== undefined && claim.fraudScore >= 50
                          ? "text-red-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {claim.fraudScore !== undefined ? `${claim.fraudScore}/100` : "—"}
                    </p>
                  </div>
                </div>

                {claim.officerDecision && (
                  <div className="rounded-xl border border-pink-400/25 bg-pink-400/[.08] p-3">
                    <p className="text-[11.5px] font-medium text-[#a9d9c9]">
                      Final Decision (Claims Officer)
                    </p>
                    <p className="mt-1 text-[15px] font-bold text-[#eafff5]">
                      {claim.officerDecision.charAt(0).toUpperCase() + claim.officerDecision.slice(1)}
                      {claim.officerAmount !== undefined
                        ? ` — ₹${claim.officerAmount.toLocaleString()}`
                        : ""}
                    </p>
                    {claim.officerNotes && (
                      <p className="mt-1 text-[13px] text-[#a9d9c9]">{claim.officerNotes}</p>
                    )}
                  </div>
                )}

                {claim.reportUrl && (
                  <a
                    href={claim.reportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center gap-2 rounded-full border-[1.5px] border-emerald-400/40 bg-white/[.06] px-5 py-2.5 text-[13.5px] font-semibold text-emerald-200 transition-all hover:border-emerald-300 hover:bg-white/[.12]"
                  >
                    <Download className="h-[15px] w-[15px]" />
                    Download Report
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
