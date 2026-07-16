import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { PLAN_LIMITS, type PlanId } from "./planLimits";

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Creates a Razorpay test-mode order via a plain REST call (no `razorpay` npm
// package needed, runs in Convex's default runtime). The secret key never
// leaves this action.
export const createOrder = action({
  args: { plan: v.union(v.literal("pro"), v.literal("plus")) },
  handler: async (
    ctx,
    args,
  ): Promise<{ orderId: string; amount: number; currency: string; keyId: string }> => {
    const user = await ctx.runQuery(api.users.current, {});
    if (!user) throw new Error("Not authenticated");

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay is not configured");

    const amount = PLAN_LIMITS[args.plan].priceInPaise;
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `plan_${args.plan}_${user._id}_${Date.now()}`,
      }),
    });
    if (!res.ok) {
      throw new Error(`Razorpay order creation failed: ${await res.text()}`);
    }
    const order = (await res.json()) as { id: string; amount: number; currency: string };
    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId };
  },
});

// No webhook: verification and the plan upgrade happen synchronously right
// after the Razorpay Checkout success callback fires in the browser.
export const verifyAndUpgrade = action({
  args: {
    plan: v.union(v.literal("pro"), v.literal("plus")),
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.string(),
    razorpaySignature: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: true; plan: PlanId }> => {
    const user = await ctx.runQuery(api.users.current, {});
    if (!user) throw new Error("Not authenticated");

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay is not configured");

    const expectedSignature = await hmacSha256Hex(
      `${args.razorpayOrderId}|${args.razorpayPaymentId}`,
      keySecret,
    );
    if (expectedSignature !== args.razorpaySignature) {
      throw new Error("Payment verification failed");
    }

    await ctx.runMutation(internal.payments.applyUpgrade, {
      userId: user._id,
      plan: args.plan,
      amount: PLAN_LIMITS[args.plan].priceInPaise,
      razorpayOrderId: args.razorpayOrderId,
      razorpayPaymentId: args.razorpayPaymentId,
    });

    return { success: true, plan: args.plan };
  },
});

// Idempotent on razorpayPaymentId so a retried verify call can't
// double-upgrade or double-record.
export const applyUpgrade = internalMutation({
  args: {
    userId: v.id("users"),
    plan: v.union(v.literal("pro"), v.literal("plus")),
    amount: v.number(),
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_razorpay_payment_id", (q) =>
        q.eq("razorpayPaymentId", args.razorpayPaymentId),
      )
      .unique();
    if (existing) return;

    await ctx.db.insert("payments", {
      userId: args.userId,
      plan: args.plan,
      amount: args.amount,
      razorpayOrderId: args.razorpayOrderId,
      razorpayPaymentId: args.razorpayPaymentId,
      status: "verified",
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.userId, { plan: args.plan, planUpdatedAt: Date.now() });
  },
});
