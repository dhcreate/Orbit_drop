"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "orbitdrop_session";

/**
 * UUID v4 without relying on `crypto.randomUUID()`, which is unavailable in
 * non-secure contexts (e.g. http://LAN_IP — only https and localhost are "secure").
 */
function createSessionId(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }

  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const h = (n: number) => n.toString(16).padStart(2, "0");
    let s = "";
    for (let i = 0; i < 16; i++) s += h(bytes[i]!);
    return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readSessionId(): string {
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = createSessionId();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return createSessionId();
  }
}

export function useSession() {
  const [sessionId, setSessionIdState] = useState("");

  useEffect(() => {
    // Session id comes from localStorage; must run after mount to match SSR HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-mount hydration of persisted id
    setSessionIdState(readSessionId());
  }, []);

  const ensureSession = useCallback(() => {
    const id = readSessionId();
    setSessionIdState(id);
    return id;
  }, []);

  return { sessionId, ensureSession };
}
