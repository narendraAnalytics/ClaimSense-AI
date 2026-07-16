"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { openRazorpayCheckout } from "@/lib/razorpay-client";
import type { PlanId } from "../../../convex/planLimits";

export function UpgradeButton({ plan }: { plan: "pro" | "plus" }) {
  const router = useRouter();
  const user = useQuery(api.users.current);
  const createOrder = useAction(api.payments.createOrder);
  const verifyAndUpgrade = useAction(api.payments.verifyAndUpgrade);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  async function handleUpgrade() {
    setError(null);
    setLoading(true);
    try {
      if (!keyId) throw new Error("Razorpay is not configured");
      const order = await createOrder({ plan });
      await openRazorpayCheckout({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "ClaimSense AI",
        description: `Upgrade to ${plan === "pro" ? "Pro" : "Plus"} (test payment)`,
        prefill: { name: user?.name ?? undefined, email: user?.email ?? undefined },
        theme: { color: "#0e8a6d" },
        handler: (response) => {
          void (async () => {
            try {
              await verifyAndUpgrade({
                plan,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              setSuccess(true);
              setLoading(false);
              router.push("/dashboard");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Payment verification failed");
              setLoading(false);
            }
          })();
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
      setLoading(false);
    }
  }

  const currentPlan: PlanId = user?.plan ?? "free";
  const isCurrent = currentPlan === plan;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => void handleUpgrade()}
        disabled={loading || isCurrent}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(110deg,#0ea77a,#0ab6c4_55%,#0ea77a)] bg-[length:220%_auto] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(14,167,122,.35)] transition-all hover:bg-right disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCurrent ? "Current Plan" : loading ? "Opening checkout…" : `Upgrade to ${plan === "pro" ? "Pro" : "Plus"}`}
      </button>
      {error && <p className="text-[13px] text-red-600">{error}</p>}
      {success && <p className="text-[13px] text-emerald-600">Upgraded! Redirecting…</p>}
    </div>
  );
}
