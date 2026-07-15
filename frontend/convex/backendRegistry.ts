import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const putClaim = internalMutation({
  args: {
    claimId: v.string(),
    policyNumber: v.string(),
    claimantName: v.string(),
    claimType: v.string(),
    incidentDate: v.string(),
    incidentDescription: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("backendClaims", {
      claimId: args.claimId,
      policyNumber: args.policyNumber,
      claimantName: args.claimantName,
      claimType: args.claimType,
      incidentDate: args.incidentDate,
      incidentDescription: args.incidentDescription,
      status: args.status,
      documentIds: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getClaimByClaimId = internalQuery({
  args: { claimId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("backendClaims")
      .withIndex("by_claim_id", (q) => q.eq("claimId", args.claimId))
      .unique();
  },
});

export const claimExists = internalQuery({
  args: { claimId: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("backendClaims")
      .withIndex("by_claim_id", (q) => q.eq("claimId", args.claimId))
      .unique();
    return row !== null;
  },
});

export const updateClaimStatus = internalMutation({
  args: {
    claimId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("backendClaims")
      .withIndex("by_claim_id", (q) => q.eq("claimId", args.claimId))
      .unique();
    if (!row) throw new Error(`Backend claim '${args.claimId}' not found`);
    await ctx.db.patch(row._id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const setReportStorageId = internalMutation({
  args: { claimId: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("backendClaims")
      .withIndex("by_claim_id", (q) => q.eq("claimId", args.claimId))
      .unique();
    if (!row) throw new Error(`Backend claim '${args.claimId}' not found`);
    await ctx.db.patch(row._id, { reportStorageId: args.storageId, updatedAt: Date.now() });
  },
});

export const getReportStorageId = internalQuery({
  args: { claimId: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("backendClaims")
      .withIndex("by_claim_id", (q) => q.eq("claimId", args.claimId))
      .unique();
    return row?.reportStorageId ?? null;
  },
});

export const attachDocument = internalMutation({
  args: { claimId: v.string(), documentId: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("backendClaims")
      .withIndex("by_claim_id", (q) => q.eq("claimId", args.claimId))
      .unique();
    if (!row) throw new Error(`Backend claim '${args.claimId}' not found`);
    await ctx.db.patch(row._id, {
      documentIds: [...row.documentIds, args.documentId],
      updatedAt: Date.now(),
    });
  },
});

export const putDocument = internalMutation({
  args: {
    documentId: v.string(),
    claimId: v.string(),
    filename: v.string(),
    mimeType: v.string(),
    extension: v.string(),
    size: v.number(),
    documentType: v.string(),
    storageId: v.id("_storage"),
    uploadStatus: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("backendDocuments", {
      documentId: args.documentId,
      claimId: args.claimId,
      filename: args.filename,
      mimeType: args.mimeType,
      extension: args.extension,
      size: args.size,
      documentType: args.documentType,
      storageId: args.storageId,
      uploadedAt: Date.now(),
      uploadStatus: args.uploadStatus,
    });
  },
});

export const getDocument = internalQuery({
  args: { documentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("backendDocuments")
      .filter((q) => q.eq(q.field("documentId"), args.documentId))
      .unique();
  },
});

export const listDocumentsForClaim = internalQuery({
  args: { claimId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("backendDocuments")
      .withIndex("by_claim_id", (q) => q.eq("claimId", args.claimId))
      .collect();
  },
});
