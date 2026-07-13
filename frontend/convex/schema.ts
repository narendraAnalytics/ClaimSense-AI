import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  claims: defineTable({
    userId: v.id("users"),
    backendClaimId: v.optional(v.string()),
    claimNumber: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    policyNumber: v.string(),
    claimantName: v.string(),
    claimType: v.string(),
    incidentDate: v.string(),
    incidentDescription: v.string(),
    recommendedAmount: v.optional(v.number()),
    fraudScore: v.optional(v.number()),
    settlementDecision: v.optional(v.string()),
    resultsJson: v.optional(v.string()),
    reportUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  documents: defineTable({
    claimId: v.id("claims"),
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    documentType: v.string(),
    backendUploaded: v.boolean(),
    uploadedAt: v.number(),
  }).index("by_claim", ["claimId"]),
});

export default schema;
