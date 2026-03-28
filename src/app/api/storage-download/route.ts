import { NextResponse } from "next/server";

function parseConvexBase(): URL | null {
  const raw = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!raw?.trim()) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function isAllowedStorageUrl(fileUrl: URL, convexBase: URL): boolean {
  if (fileUrl.hostname !== convexBase.hostname) return false;
  if (fileUrl.protocol !== convexBase.protocol) return false;
  return true;
}

function safeFilename(name: string): string {
  const base = name.replace(/[/\\]/g, "").trim() || "download";
  return base.replace(/[^a-zA-Z0-9._\- ()[\]]+/g, "_").slice(0, 200);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { url?: unknown }).url !== "string"
  ) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const { url, filename: rawName } = body as {
    url: string;
    filename?: string;
  };

  const convexBase = parseConvexBase();
  if (!convexBase) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  let fileUrl: URL;
  try {
    fileUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!isAllowedStorageUrl(fileUrl, convexBase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const upstream = await fetch(url, { redirect: "follow" });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }

  const filename = safeFilename(
    typeof rawName === "string" ? rawName : "download",
  );

  const contentType =
    upstream.headers.get("Content-Type") ?? "application/octet-stream";

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
