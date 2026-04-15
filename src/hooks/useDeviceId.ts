"use client";

import { useEffect, useState } from "react";

const DEVICE_KEY = "orbitdrop_device_id";

function createDeviceId(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useDeviceId(): string {
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    let did = localStorage.getItem(DEVICE_KEY);
    if (!did) {
      did = createDeviceId();
      localStorage.setItem(DEVICE_KEY, did);
    }
    setDeviceId(did);
  }, []);

  return deviceId;
}
