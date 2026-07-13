import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";

async function assertOwnsClaim(ctx: QueryCtx | MutationCtx, claimId: Id<"claims">) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const claim = await ctx.db.get(claimId);
  if (!claim || claim.userId !== userId) throw new Error("Claim not found");
}

export const generateUploadUrl = mutation({
  args: { claimId: v.id("claims") },
  handler: async (ctx, args) => {
    await assertOwnsClaim(ctx, args.claimId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const insert = mutation({
  args: {
    claimId: v.id("claims"),
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    documentType: v.string(),
    backendUploaded: v.boolean(),
  },
  handler: async (ctx, args) => {
    await assertOwnsClaim(ctx, args.claimId);
    return await ctx.db.insert("documents", {
      claimId: args.claimId,
      storageId: args.storageId,
      filename: args.filename,
      mimeType: args.mimeType,
      size: args.size,
      documentType: args.documentType,
      backendUploaded: args.backendUploaded,
      uploadedAt: Date.now(),
    });
  },
});

export const markBackendUploaded = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");
    await assertOwnsClaim(ctx, doc.claimId);
    await ctx.db.patch(args.documentId, { backendUploaded: true });
  },
});

export const listByClaim = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, args) => {
    await assertOwnsClaim(ctx, args.claimId);
    return await ctx.db
      .query("documents")
      .withIndex("by_claim", (q) => q.eq("claimId", args.claimId))
      .order("desc")
      .collect();
  },
});

export const remove = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");
    await assertOwnsClaim(ctx, doc.claimId);
    await ctx.storage.delete(doc.storageId);
    await ctx.db.delete(args.documentId);
  },
});

export const getUrl = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");
    await assertOwnsClaim(ctx, doc.claimId);
    return await ctx.storage.getUrl(doc.storageId);
  },
});
