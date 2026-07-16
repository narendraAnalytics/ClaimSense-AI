import { Crown, Sparkles } from "lucide-react";
import { PLAN_LIMITS, type PlanId } from "../../../convex/planLimits";

type PlanTagProps = {
  plan: PlanId;
};

export function PlanTag({ plan }: PlanTagProps) {
  const label = PLAN_LIMITS[plan].label;

  if (plan === "free") {
    return (
      <span className="inline-flex items-center rounded-full border border-[#c9d6d1] bg-[#eef3f1] px-3 py-1 text-[12px] font-semibold tracking-wide text-[#4c7d6e]">
        {label}
      </span>
    );
  }

  if (plan === "pro") {
    return (
      <span className="relative inline-flex items-center gap-1 rounded-full bg-[linear-gradient(110deg,#0ea77a,#0ab6c4_45%,#0ea77a_90%)] bg-[length:220%_auto] px-3 py-1 text-[12px] font-bold tracking-wide text-white shadow-[0_4px_14px_rgba(14,167,122,.35),inset_0_1px_0_rgba(255,255,255,.35)] animate-cs-shimmer">
        <Sparkles className="h-3 w-3" />
        {label}
      </span>
    );
  }

  return (
    <span className="relative inline-flex items-center">
      <span className="absolute inset-0 rounded-full bg-[#f5b942]/60 animate-cs-pulse-ring" />
      <span className="relative inline-flex items-center gap-1 rounded-full bg-[linear-gradient(110deg,#d97706,#f5b942_45%,#d97706_90%)] bg-[length:220%_auto] px-3 py-1 text-[12px] font-bold tracking-wide text-white shadow-[0_4px_14px_rgba(217,119,6,.4),inset_0_1px_0_rgba(255,255,255,.4)] animate-cs-shimmer">
        <Crown className="h-3 w-3" />
        {label}
      </span>
    </span>
  );
}
