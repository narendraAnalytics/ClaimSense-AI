"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Check } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { PLAN_LIMITS, type PlanId } from "../../../convex/planLimits";
import { UpgradeButton } from "@/components/pricing/upgrade-button";
import { SiteHeader } from "@/components/landing/site-header";

const PLAN_FEATURES: Record<PlanId, string[]> = {
  free: ["1 claim per month", "Up to 4 documents per claim", "Full AI pipeline results"],
  pro: ["10 claims per month", "Up to 15 documents per claim", "Full AI pipeline results", "Priority support"],
  plus: ["Unlimited claims", "Unlimited documents per claim", "Full AI pipeline results", "Priority support"],
};

function formatPrice(paise: number): string {
  if (paise === 0) return "Free";
  return `₹${(paise / 100).toFixed(0)}`;
}

export default function PricingPage() {
  const user = useQuery(api.users.current);
  const currentPlan: PlanId = user?.plan ?? "free";

  return (
    <div className="min-h-screen bg-[#f4faf7]">
      <SiteHeader minimal />
      <div className="mx-auto w-full max-w-[1000px] px-6 py-14">
        <div className="text-center">
          <h1 className="font-heading text-[32px] font-bold tracking-tight text-[#0c2b24]">
            Pricing
          </h1>
          <p className="mt-2 text-[15.5px] text-[#4c7d6e]">
            Test-mode Razorpay checkout — no real charges. Upgrade to raise your claim and
            document limits.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {(Object.keys(PLAN_LIMITS) as PlanId[]).map((planId) => {
            const plan = PLAN_LIMITS[planId];
            const isCurrent = currentPlan === planId;
            return (
              <div
                key={planId}
                className={`flex flex-col rounded-3xl border p-7 backdrop-blur-md ${
                  isCurrent
                    ? "border-[#0e8a6d]/50 bg-white/90 shadow-[0_20px_60px_rgba(16,185,129,.18)]"
                    : "border-emerald-500/20 bg-white/70"
                }`}
              >
                <h2 className="font-heading text-[20px] font-bold text-[#0c2b24]">
                  {plan.label}
                </h2>
                <p className="mt-2 text-[28px] font-bold text-[#0c2b24]">
                  {formatPrice(plan.priceInPaise)}
                  {plan.priceInPaise > 0 && (
                    <span className="text-[14px] font-medium text-[#4c7d6e]"> one-time (test)</span>
                  )}
                </p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {PLAN_FEATURES[planId].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[13.5px] text-[#1c4a3f]">
                      <Check className="mt-0.5 h-[15px] w-[15px] shrink-0 text-[#0e8a6d]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {planId === "free" ? (
                    <div className="rounded-full border border-emerald-500/25 px-6 py-3 text-center text-[15px] font-semibold text-[#4c7d6e]">
                      {isCurrent ? "Current Plan" : "Default Plan"}
                    </div>
                  ) : (
                    <UpgradeButton plan={planId} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-[13px] text-[#4c7d6e]">
          <Link href="/dashboard" className="underline hover:text-[#0e8a6d]">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
