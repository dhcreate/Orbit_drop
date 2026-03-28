"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DropZoneView } from "@/components/views/DropZoneView";
import { LandingView } from "@/components/views/LandingView";
import { RoomLogicView } from "@/components/views/RoomLogicView";
import type { LobbyOverlay } from "@/lib/lobbyOverlay";

const CanvasBackground = dynamic(
  () => import("@/components/CanvasBackground"),
  { ssr: false },
);

type AppState = "room-logic" | "drop-zone";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("room-logic");
  const [roomData, setRoomData] = useState<{
    code: string;
    isHost: boolean;
  } | null>(null);
  /** Bump after leaving a room so RoomLogicView remounts with a clean create/join state. */
  const [lobbyKey, setLobbyKey] = useState(0);
  const [lobbyOverlay, setLobbyOverlay] = useState<LobbyOverlay>(null);

  const lobbyBack = useCallback(() => {
    setLobbyOverlay((o) => {
      if (!o) return null;
      if (o.kind === "choice") return null;
      if (o.via === "choice") return { kind: "choice" };
      return null;
    });
  }, []);

  const lobby = useMemo(
    () => ({
      openChoice: () => setLobbyOverlay({ kind: "choice" }),
      openCreate: (via: "card" | "choice") =>
        setLobbyOverlay({ kind: "create", via }),
      openJoin: (via: "card" | "choice") =>
        setLobbyOverlay({ kind: "join", via }),
      close: () => setLobbyOverlay(null),
      back: lobbyBack,
    }),
    [lobbyBack],
  );

  useEffect(() => {
    if (appState !== "drop-zone") return;
    const htmlPrev = document.documentElement.style.overflow;
    const bodyPrev = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = htmlPrev;
      document.body.style.overflow = bodyPrev;
    };
  }, [appState]);

  const handleJoinRoom = (code: string, host: boolean) => {
    setLobbyOverlay(null);
    setRoomData({ code, isHost: host });
    setAppState("drop-zone");
  };

  const handleLeaveRoom = useCallback(() => {
    setLobbyOverlay(null);
    setRoomData(null);
    setAppState("room-logic");
    setLobbyKey((k) => k + 1);
  }, []);

  return (
    <main
      className={
        appState === "drop-zone"
          ? "relative flex h-dvh min-h-dvh w-full flex-col overflow-hidden bg-[#0a0a0a]"
          : "relative flex min-h-dvh w-full flex-col bg-[#0a0a0a]"
      }
    >
      <CanvasBackground />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col pointer-events-auto">
        <AnimatePresence mode="wait">
          {appState === "room-logic" ? (
            <motion.div
              key={`lobby-${lobbyKey}`}
              className="flex min-h-dvh flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LandingView lobby={lobby} />
              <RoomLogicView
                onJoinRoom={handleJoinRoom}
                lobbyOverlay={lobbyOverlay}
                lobby={lobby}
              />
            </motion.div>
          ) : roomData ? (
            <motion.div
              key={`room-${roomData.code}`}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DropZoneView
                roomCode={roomData.code}
                isHost={roomData.isHost}
                onLeaveRoom={handleLeaveRoom}
                fullPage
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}
