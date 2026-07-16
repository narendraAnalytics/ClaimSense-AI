// Plain TS module (no Convex-specific imports) so it can be imported both by
// Convex functions and by the frontend via relative path.

export type PlanId = "free" | "pro" | "plus";

export const PLAN_LIMITS: Record<
  PlanId,
  {
    label: string;
    claimsPerMonth: number | null; // null = unlimited
    docsPerClaim: number | null; // null = unlimited
    priceInPaise: number;
  }
> = {
  free: { label: "Free", claimsPerMonth: 1, docsPerClaim: 4, priceInPaise: 0 },
  pro: { label: "Pro", claimsPerMonth: 10, docsPerClaim: 15, priceInPaise: 49900 },
  plus: { label: "Plus", claimsPerMonth: null, docsPerClaim: null, priceInPaise: 99900 },
};

export function resolvePlan(plan: string | undefined | null): PlanId {
  return plan === "pro" || plan === "plus" ? plan : "free";
}
