"use client";

import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useEffect, useRef } from "react";

/**
 * When the device loses network (e.g. Wi‑Fi off), the browser fires `offline`.
 * If this client is the room creator, we tear down the room in Convex so
 * everyone subscribed to `getRoomByCode` sees it disappear immediately.
 * If the close call fails while offline, we retry once when `online` fires.
 */
export function useCloseRoomWhenCreatorOffline(
  code: string | null | undefined,
  creatorSessionId: string | undefined,
  enabled: boolean,
  onCloseSuccess?: () => void,
) {
  const closeRoom = useMutation(api.rooms.closeRoomAsCreator);
  const pendingRetry = useRef(false);
  const onCloseSuccessRef = useRef(onCloseSuccess);

  useEffect(() => {
    onCloseSuccessRef.current = onCloseSuccess;
  }, [onCloseSuccess]);

  const normalizedCode = code?.trim().toUpperCase() ?? "";

  useEffect(() => {
    if (!enabled || !normalizedCode || !creatorSessionId) return;

    const attemptClose = () => {
      void closeRoom({
        code: normalizedCode,
        creatorSessionId: creatorSessionId,
      })
        .then(() => {
          pendingRetry.current = false;
          onCloseSuccessRef.current?.();
        })
        .catch(() => {
          pendingRetry.current = true;
        });
    };

    const onOffline = () => {
      attemptClose();
    };

    const onOnline = () => {
      if (pendingRetry.current) {
        attemptClose();
      }
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [enabled, normalizedCode, creatorSessionId, closeRoom]);
}
