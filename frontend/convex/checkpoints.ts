import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const putCheckpoint = internalMutation({
  args: {
    threadId: v.string(),
    checkpointNs: v.string(),
    checkpointId: v.string(),
    parentCheckpointId: v.optional(v.string()),
    type: v.string(),
    checkpoint: v.string(),
    metadata: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("checkpoints")
      .withIndex("by_thread", (q) =>
        q
          .eq("threadId", args.threadId)
          .eq("checkpointNs", args.checkpointNs)
          .eq("checkpointId", args.checkpointId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        parentCheckpointId: args.parentCheckpointId,
        type: args.type,
        checkpoint: args.checkpoint,
        metadata: args.metadata,
      });
      return existing._id;
    }

    return await ctx.db.insert("checkpoints", {
      threadId: args.threadId,
      checkpointNs: args.checkpointNs,
      checkpointId: args.checkpointId,
      parentCheckpointId: args.parentCheckpointId,
      type: args.type,
      checkpoint: args.checkpoint,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

export const putWrites = internalMutation({
  args: {
    threadId: v.string(),
    checkpointNs: v.string(),
    checkpointId: v.string(),
    writes: v.array(
      v.object({
        taskId: v.string(),
        idx: v.number(),
        channel: v.string(),
        type: v.string(),
        value: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const write of args.writes) {
      const existing = await ctx.db
        .query("checkpointWrites")
        .withIndex("by_checkpoint", (q) =>
          q
            .eq("threadId", args.threadId)
            .eq("checkpointNs", args.checkpointNs)
            .eq("checkpointId", args.checkpointId),
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("taskId"), write.taskId),
            q.eq(q.field("idx"), write.idx),
          ),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          channel: write.channel,
          type: write.type,
          value: write.value,
        });
      } else {
        await ctx.db.insert("checkpointWrites", {
          threadId: args.threadId,
          checkpointNs: args.checkpointNs,
          checkpointId: args.checkpointId,
          taskId: write.taskId,
          idx: write.idx,
          channel: write.channel,
          type: write.type,
          value: write.value,
        });
      }
    }
  },
});

export const getLatestCheckpoint = internalQuery({
  args: {
    threadId: v.string(),
    checkpointNs: v.string(),
    checkpointId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.checkpointId) {
      return await ctx.db
        .query("checkpoints")
        .withIndex("by_thread", (q) =>
          q
            .eq("threadId", args.threadId)
            .eq("checkpointNs", args.checkpointNs)
            .eq("checkpointId", args.checkpointId!),
        )
        .unique();
    }

    return await ctx.db
      .query("checkpoints")
      .withIndex("by_thread", (q) =>
        q.eq("threadId", args.threadId).eq("checkpointNs", args.checkpointNs),
      )
      .order("desc")
      .first();
  },
});

export const listCheckpoints = internalQuery({
  args: {
    threadId: v.string(),
    checkpointNs: v.string(),
    before: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("checkpoints")
      .withIndex("by_thread", (q) =>
        q.eq("threadId", args.threadId).eq("checkpointNs", args.checkpointNs),
      )
      .order("desc")
      .collect();

    const filtered = args.before
      ? rows.filter((r) => r.checkpointId < args.before!)
      : rows;

    return args.limit ? filtered.slice(0, args.limit) : filtered;
  },
});

export const getWrites = internalQuery({
  args: {
    threadId: v.string(),
    checkpointNs: v.string(),
    checkpointId: v.string(),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("checkpointWrites")
      .withIndex("by_checkpoint", (q) =>
        q
          .eq("threadId", args.threadId)
          .eq("checkpointNs", args.checkpointNs)
          .eq("checkpointId", args.checkpointId),
      )
      .collect();
    return rows.sort((a, b) => a.idx - b.idx);
  },
});

export const deleteThread = internalMutation({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const checkpoints = await ctx.db
      .query("checkpoints")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
    for (const row of checkpoints) {
      await ctx.db.delete(row._id);
    }

    const writes = await ctx.db
      .query("checkpointWrites")
      .withIndex("by_checkpoint", (q) => q.eq("threadId", args.threadId))
      .collect();
    for (const row of writes) {
      await ctx.db.delete(row._id);
    }
  },
});
