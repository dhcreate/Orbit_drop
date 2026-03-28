import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LEN = 6;
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

function randomCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]!;
  }
  return out;
}

type RoomDoc = Doc<"rooms">;

async function roomWithSignedUrls(
  ctx: QueryCtx | MutationCtx,
  doc: RoomDoc,
) {
  const files = await Promise.all(
    doc.files.map(async (f) => {
      const url = await ctx.storage.getUrl(f.storageId);
      return {
        storageId: f.storageId as string,
        name: f.name,
        size: f.size,
        type: f.type,
        uploadedAt: f.uploadedAt,
        url: url ?? undefined,
      };
    }),
  );
  return {
    _id: doc._id,
    _creationTime: doc._creationTime,
    code: doc.code,
    createdAt: doc.createdAt,
    expiresAt: doc.expiresAt,
    creatorId: doc.creatorId,
    peopleCount: doc.peopleCount,
    files,
  };
}

export const createRoom = mutation({
  args: { creatorSessionId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    let code = randomCode();
    for (let attempt = 0; attempt < 20; attempt++) {
      const existing = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (!existing) break;
      code = randomCode();
    }
    await ctx.db.insert("rooms", {
      code,
      createdAt: now,
      expiresAt: now + ROOM_TTL_MS,
      creatorId: args.creatorSessionId,
      peopleCount: 0,
      files: [],
    });
    return code;
  },
});

export const joinRoom = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.code.trim().toUpperCase();
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .unique();
    if (!room) return null;
    if (room.expiresAt < Date.now()) return null;
    return await roomWithSignedUrls(ctx, room);
  },
});

export const getRoomByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.code.trim().toUpperCase();
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .unique();
    if (!room) return null;
    if (room.expiresAt < Date.now()) return null;
    return await roomWithSignedUrls(ctx, room);
  },
});

export const enterRoom = mutation({
  args: { code: v.string(), sessionId: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.code.trim().toUpperCase();
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .unique();
    if (!room) throw new Error("Room not found");
    if (room.expiresAt < Date.now()) throw new Error("Room expired");

    const existing = await ctx.db
      .query("roomSessions")
      .withIndex("by_code_and_session", (q) =>
        q.eq("code", normalized).eq("sessionId", args.sessionId),
      )
      .unique();
    if (existing) return;

    await ctx.db.insert("roomSessions", {
      code: normalized,
      sessionId: args.sessionId,
    });
    await ctx.db.patch(room._id, {
      peopleCount: room.peopleCount + 1,
    });
  },
});

export const leaveRoom = mutation({
  args: { code: v.string(), sessionId: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.code.trim().toUpperCase();
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .unique();
    if (!room) return;

    const existing = await ctx.db
      .query("roomSessions")
      .withIndex("by_code_and_session", (q) =>
        q.eq("code", normalized).eq("sessionId", args.sessionId),
      )
      .unique();
    if (!existing) return;

    await ctx.db.delete(existing._id);
    await ctx.db.patch(room._id, {
      peopleCount: Math.max(0, room.peopleCount - 1),
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const addFileToRoom = mutation({
  args: {
    code: v.string(),
    storageId: v.id("_storage"),
    name: v.string(),
    size: v.number(),
    type: v.optional(v.string()),
    uploadedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const normalized = args.code.trim().toUpperCase();
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .unique();
    if (!room) throw new Error("Room not found");
    if (room.expiresAt < Date.now()) throw new Error("Room expired");

    const entry = {
      storageId: args.storageId,
      name: args.name,
      size: args.size,
      uploadedAt: args.uploadedAt ?? Date.now(),
      ...(args.type !== undefined && args.type !== ""
        ? { type: args.type }
        : {}),
    };

    await ctx.db.patch(room._id, {
      files: [...room.files, entry],
    });
  },
});
