import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // Overrides authTables.users to add plan fields, keeping every field/index
  // from @convex-dev/auth's own users table definition (confirmed via
  // node_modules/@convex-dev/auth/dist/server/implementation/types.js).
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    plan: v.optional(v.union(v.literal("pro"), v.literal("plus"))), // undefined = free
    planUpdatedAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  // Razorpay test-mode payment audit trail, also used to make plan upgrades
  // idempotent (a retried verify call can't double-upgrade or double-record).
  payments: defineTable({
    userId: v.id("users"),
    plan: v.union(v.literal("pro"), v.literal("plus")),
    amount: v.number(), // paise
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.string(),
    status: v.literal("verified"),
    createdAt: v.number(),
  })
    .index("by_razorpay_payment_id", ["razorpayPaymentId"])
    .index("by_user", ["userId"]),

  // Records what plan/amount each Razorpay order was created for, so
  // verifyAndUpgrade can trust the server's own record instead of a
  // client-supplied `plan` argument (which the browser could tamper with to
  // request a higher plan than what was actually paid for).
  pendingOrders: defineTable({
    userId: v.id("users"),
    plan: v.union(v.literal("pro"), v.literal("plus")),
    amount: v.number(), // paise
    razorpayOrderId: v.string(),
    createdAt: v.number(),
  }).index("by_razorpay_order_id", ["razorpayOrderId"]),

  claims: defineTable({
    userId: v.id("users"),
    backendClaimId: v.optional(v.string()),
    claimNumber: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("awaiting_approval"),
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
    officerDecision: v.optional(v.string()),
    officerAmount: v.optional(v.number()),
    officerNotes: v.optional(v.string()),
    officerDecidedAt: v.optional(v.number()),
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

  // LangGraph checkpoint storage for the backend's claim-processing graph.
  // Not user-scoped / not driven by Convex Auth — keyed by the backend's own
  // claim_id string as thread_id, written only via internal functions called
  // by the FastAPI backend using its admin deploy key.
  checkpoints: defineTable({
    threadId: v.string(),
    checkpointNs: v.string(),
    checkpointId: v.string(),
    parentCheckpointId: v.optional(v.string()),
    type: v.string(),
    checkpoint: v.string(),
    metadata: v.string(),
    createdAt: v.number(),
  }).index("by_thread", ["threadId", "checkpointNs", "checkpointId"]),

  checkpointWrites: defineTable({
    threadId: v.string(),
    checkpointNs: v.string(),
    checkpointId: v.string(),
    taskId: v.string(),
    idx: v.number(),
    channel: v.string(),
    type: v.string(),
    value: v.string(),
  }).index("by_checkpoint", ["threadId", "checkpointNs", "checkpointId"]),

  // Backend's own claim/document registries, migrated off in-memory Python
  // dicts. Not user-scoped / not driven by Convex Auth — keyed by the
  // backend's own claim_id/document_id strings, written only via internal
  // functions called by the FastAPI backend using its admin deploy key.
  // Deliberately separate from the user-facing `claims`/`documents` tables
  // above, which stay browser/Convex-Auth-owned.
  backendClaims: defineTable({
    claimId: v.string(),
    policyNumber: v.string(),
    claimantName: v.string(),
    claimType: v.string(),
    incidentDate: v.string(),
    incidentDescription: v.string(),
    status: v.string(),
    documentIds: v.array(v.string()),
    reportStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_claim_id", ["claimId"]),

  backendDocuments: defineTable({
    documentId: v.string(),
    claimId: v.string(),
    filename: v.string(),
    mimeType: v.string(),
    extension: v.string(),
    size: v.number(),
    documentType: v.string(),
    storageId: v.id("_storage"),
    uploadedAt: v.number(),
    uploadStatus: v.string(),
  }).index("by_claim_id", ["claimId"]),
});

export default schema;
