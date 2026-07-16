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

// Constant-time comparison so signature verification doesn't leak timing
// information about how many leading characters matched.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Creates a Razorpay test-mode order via a plain REST call (no `razorpay` npm
// package needed, runs in Convex's default runtime). The secret key never
// leaves this action. The plan/amount this order was created for is recorded
// server-side (pendingOrders) so verifyAndUpgrade never has to trust a
// client-supplied plan — otherwise a user could pay for Pro and claim Plus.
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
        receipt: `${args.plan}_${user._id.slice(-12)}_${Date.now()}`,
      }),
    });
    if (!res.ok) {
      throw new Error(`Razorpay order creation failed: ${await res.text()}`);
    }
    const order = (await res.json()) as { id: string; amount: number; currency: string };

    await ctx.runMutation(internal.payments.recordPendingOrder, {
      userId: user._id,
      plan: args.plan,
      amount: order.amount,
      razorpayOrderId: order.id,
    });

    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId };
  },
});

export const recordPendingOrder = internalMutation({
  args: {
    userId: v.id("users"),
    plan: v.union(v.literal("pro"), v.literal("plus")),
    amount: v.number(),
    razorpayOrderId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("pendingOrders", { ...args, createdAt: Date.now() });
  },
});

// No webhook: verification and the plan upgrade happen synchronously right
// after the Razorpay Checkout success callback fires in the browser. The
// plan/amount applied come from the server-recorded pendingOrders row for
// this orderId, never from a client-supplied argument.
export const verifyAndUpgrade = action({
  args: {
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
    if (!timingSafeEqual(expectedSignature, args.razorpaySignature)) {
      throw new Error("Payment verification failed");
    }

    const plan = await ctx.runMutation(internal.payments.applyUpgrade, {
      userId: user._id,
      razorpayOrderId: args.razorpayOrderId,
      razorpayPaymentId: args.razorpayPaymentId,
    });

    return { success: true, plan };
  },
});

// Idempotent on razorpayPaymentId so a retried verify call can't
// double-upgrade or double-record. Looks up the plan/amount from the
// server-recorded pendingOrders row (written by createOrder) rather than
// trusting the caller, and confirms the order belongs to this user.
export const applyUpgrade = internalMutation({
  args: {
    userId: v.id("users"),
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.string(),
  },
  handler: async (ctx, args): Promise<PlanId> => {
    const pendingOrder = await ctx.db
      .query("pendingOrders")
      .withIndex("by_razorpay_order_id", (q) => q.eq("razorpayOrderId", args.razorpayOrderId))
      .unique();
    if (!pendingOrder) throw new Error("No matching order found");
    if (pendingOrder.userId !== args.userId) {
      throw new Error("Order does not belong to this user");
    }

    const existing = await ctx.db
      .query("payments")
      .withIndex("by_razorpay_payment_id", (q) =>
        q.eq("razorpayPaymentId", args.razorpayPaymentId),
      )
      .unique();
    if (existing) return existing.plan;

    await ctx.db.insert("payments", {
      userId: pendingOrder.userId,
      plan: pendingOrder.plan,
      amount: pendingOrder.amount,
      razorpayOrderId: args.razorpayOrderId,
      razorpayPaymentId: args.razorpayPaymentId,
      status: "verified",
      createdAt: Date.now(),
    });
    await ctx.db.patch(pendingOrder.userId, { plan: pendingOrder.plan, planUpdatedAt: Date.now() });
    await ctx.db.delete(pendingOrder._id);

    return pendingOrder.plan;
  },
});
