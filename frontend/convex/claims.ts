import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { PLAN_LIMITS, resolvePlan } from "./planLimits";

async function getOwnedClaim(
  ctx: QueryCtx | MutationCtx,
  claimId: Id<"claims">,
): Promise<Doc<"claims">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const claim = await ctx.db.get(claimId);
  if (!claim || claim.userId !== userId) throw new Error("Claim not found");
  return claim;
}

function startOfCurrentMonthUTC(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
}

async function countClaimsThisMonth(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<number> {
  const monthStart = startOfCurrentMonthUTC();
  const claims = await ctx.db
    .query("claims")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return claims.filter((c) => c.createdAt >= monthStart).length;
}

export const create = mutation({
  args: {
    policyNumber: v.string(),
    claimantName: v.string(),
    claimType: v.string(),
    incidentDate: v.string(),
    incidentDescription: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    const plan = resolvePlan(user?.plan);
    const limit = PLAN_LIMITS[plan].claimsPerMonth;
    if (limit !== null) {
      const used = await countClaimsThisMonth(ctx, userId);
      if (used >= limit) {
        throw new Error(
          `Free plan limit reached: ${limit} claim(s) per month. Upgrade to Pro or Plus for more.`,
        );
      }
    }

    const now = Date.now();
    const claimNumber = `CLM-${now.toString(36).toUpperCase()}`;
    return await ctx.db.insert("claims", {
      userId,
      claimNumber,
      status: "draft",
      policyNumber: args.policyNumber,
      claimantName: args.claimantName,
      claimType: args.claimType,
      incidentDate: args.incidentDate,
      incidentDescription: args.incidentDescription,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("claims")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, args) => {
    return await getOwnedClaim(ctx, args.claimId);
  },
});

export const setBackendClaimId = mutation({
  args: { claimId: v.id("claims"), backendClaimId: v.string() },
  handler: async (ctx, args) => {
    await getOwnedClaim(ctx, args.claimId);
    await ctx.db.patch(args.claimId, {
      backendClaimId: args.backendClaimId,
      updatedAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    claimId: v.id("claims"),
    status: v.union(
      v.literal("draft"),
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, args) => {
    await getOwnedClaim(ctx, args.claimId);
    await ctx.db.patch(args.claimId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const saveResults = mutation({
  args: {
    claimId: v.id("claims"),
    status: v.union(
      v.literal("awaiting_approval"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    resultsJson: v.optional(v.string()),
    recommendedAmount: v.optional(v.number()),
    fraudScore: v.optional(v.number()),
    settlementDecision: v.optional(v.string()),
    reportUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getOwnedClaim(ctx, args.claimId);
    await ctx.db.patch(args.claimId, {
      status: args.status,
      resultsJson: args.resultsJson,
      recommendedAmount: args.recommendedAmount,
      fraudScore: args.fraudScore,
      settlementDecision: args.settlementDecision,
      reportUrl: args.reportUrl,
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });
  },
});

export const saveDecision = mutation({
  args: {
    claimId: v.id("claims"),
    officerDecision: v.string(),
    officerAmount: v.optional(v.number()),
    officerNotes: v.optional(v.string()),
    resultsJson: v.optional(v.string()),
    recommendedAmount: v.optional(v.number()),
    reportUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getOwnedClaim(ctx, args.claimId);
    await ctx.db.patch(args.claimId, {
      status: "completed",
      officerDecision: args.officerDecision,
      officerAmount: args.officerAmount,
      officerNotes: args.officerNotes,
      officerDecidedAt: Date.now(),
      resultsJson: args.resultsJson,
      recommendedAmount: args.recommendedAmount,
      reportUrl: args.reportUrl,
      updatedAt: Date.now(),
    });
  },
});

export const getUsage = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    const plan = resolvePlan(user?.plan);
    const claimsUsedThisMonth = await countClaimsThisMonth(ctx, userId);
    return {
      plan,
      claimsUsedThisMonth,
      claimsLimit: PLAN_LIMITS[plan].claimsPerMonth,
      docsLimitPerClaim: PLAN_LIMITS[plan].docsPerClaim,
    };
  },
});
