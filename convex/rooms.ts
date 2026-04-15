import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LEN = 6;
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

function isValidCodeShape(code: string): boolean {
  return /^[A-Z2-9]{6}$/.test(code.trim().toUpperCase());
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

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
        uploaderName: f.uploaderName,
        uploaderDeviceId: f.uploaderDeviceId,
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
    const normalized = normalizeCode(args.code);
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
    const normalized = normalizeCode(args.code);
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
  args: {
    code: v.string(),
    sessionId: v.string(),
    username: v.string(),
    deviceId: v.string(),
  },
  handler: async (ctx, { code, sessionId, username, deviceId }) => {
    if (!isValidCodeShape(code)) return { ok: false as const };
    const normalized = normalizeCode(code);
    const cleanedSessionId = sessionId.trim();
    const cleanedDeviceId = deviceId.trim();
    const cleanedUsername = username.trim();
    if (!cleanedSessionId || !cleanedDeviceId || !cleanedUsername) {
      return { ok: false as const };
    }

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .unique();
    if (!room || room.expiresAt < Date.now()) return { ok: false as const };

    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .collect();
    const takenByOther = members.some(
      (m) =>
        m.username.toLowerCase() === cleanedUsername.toLowerCase() &&
        m.deviceId !== cleanedDeviceId,
    );
    if (takenByOther) {
      return { ok: false as const, reason: "username_taken" as const };
    }

    const existing = await ctx.db
      .query("roomSessions")
      .withIndex("by_code_and_session", (q) =>
        q.eq("code", normalized).eq("sessionId", cleanedSessionId),
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("roomSessions", {
        code: normalized,
        sessionId: cleanedSessionId,
      });
      await ctx.db.patch(room._id, {
        peopleCount: room.peopleCount + 1,
      });
    }

    const existingMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_code_device", (q) =>
        q.eq("code", normalized).eq("deviceId", cleanedDeviceId),
      )
      .unique();

    if (existingMember) {
      await ctx.db.patch(existingMember._id, {
        username: cleanedUsername,
        sessionId: cleanedSessionId,
      });
    } else {
      await ctx.db.insert("roomMembers", {
        code: normalized,
        sessionId: cleanedSessionId,
        deviceId: cleanedDeviceId,
        username: cleanedUsername,
        joinedAt: Date.now(),
      });
    }
    return { ok: true as const };
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

    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_code_session", (q) =>
        q.eq("code", normalized).eq("sessionId", args.sessionId),
      )
      .unique();
    if (member) {
      await ctx.db.delete(member._id);
    }
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const closeRoomAsCreator = mutation({
  args: {
    code: v.string(),
    creatorSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = args.code.trim().toUpperCase();
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .unique();
    if (!room) return;
    if (room.creatorId !== args.creatorSessionId) {
      throw new Error("Only the room creator can close this room");
    }

    for (const f of room.files) {
      try {
        await ctx.storage.delete(f.storageId);
      } catch {
        /* file may already be removed */
      }
    }

    const sessions = await ctx.db
      .query("roomSessions")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .collect();
    for (const s of sessions) {
      await ctx.db.delete(s._id);
    }

    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .collect();
    for (const m of members) {
      await ctx.db.delete(m._id);
    }

    await ctx.db.delete(room._id);
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
    uploaderName: v.string(),
    uploaderDeviceId: v.string(),
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
      uploaderName: args.uploaderName,
      uploaderDeviceId: args.uploaderDeviceId,
      ...(args.type !== undefined && args.type !== ""
        ? { type: args.type }
        : {}),
    };

    await ctx.db.patch(room._id, {
      files: [...room.files, entry],
    });
  },
});

export const getRoomMembers = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const normalized = code.trim().toUpperCase();
    return await ctx.db
      .query("roomMembers")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .collect();
  },
});

export const isUsernameAvailableInRoom = query({
  args: {
    code: v.string(),
    username: v.string(),
    deviceId: v.string(),
  },
  handler: async (ctx, { code, username, deviceId }) => {
    if (!isValidCodeShape(code)) return true;
    const normalized = normalizeCode(code);
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .collect();

    const takenByOther = members.some(
      (m) =>
        m.username.toLowerCase() === username.trim().toLowerCase() &&
        m.deviceId !== deviceId,
    );
    return !takenByOther;
  },
});
