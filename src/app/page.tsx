"use client";

import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useState } from "react";
import { DropZoneView } from "@/components/views/DropZoneView";
import { LandingView } from "@/components/views/LandingView";
import { RoomLogicView } from "@/components/views/RoomLogicView";

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

  const handleScrollToApp = () => {
    document.getElementById("app")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleJoinRoom = (code: string, host: boolean) => {
    setRoomData({ code, isHost: host });
    setAppState("drop-zone");
    setTimeout(() => {
      document.getElementById("app")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <main className="relative flex min-h-[200vh] w-full flex-col bg-[#0a0a0a]">
      <CanvasBackground />
      <div className="relative z-10 flex w-full flex-col pointer-events-auto">
        <LandingView onScrollToApp={handleScrollToApp} />
        <section
          id="app"
          className="flex min-h-screen flex-col items-center justify-center px-6 py-24 md:px-12"
        >
          <AnimatePresence mode="wait">
            {appState === "room-logic" && (
              <RoomLogicView key="room-logic" onJoinRoom={handleJoinRoom} />
            )}
            {appState === "drop-zone" && roomData && (
              <DropZoneView
                key="drop-zone"
                roomCode={roomData.code}
                isHost={roomData.isHost}
              />
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
