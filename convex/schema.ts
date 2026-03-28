import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    code: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    creatorId: v.string(),
    peopleCount: v.number(),
    files: v.array(
      v.object({
        storageId: v.id("_storage"),
        name: v.string(),
        size: v.number(),
        type: v.optional(v.string()),
        uploadedAt: v.optional(v.number()),
      }),
    ),
  }).index("by_code", ["code"]),

  roomSessions: defineTable({
    code: v.string(),
    sessionId: v.string(),
  })
    .index("by_code_and_session", ["code", "sessionId"])
    .index("by_code", ["code"]),
});
