"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { AnimatePresence } from "framer-motion"
import { LandingView } from "@/components/views/LandingView"
import { RoomLogicView } from "@/components/views/RoomLogicView"
import { DropZoneView } from "@/components/views/DropZoneView"

// Dynamically import CanvasBackground since it uses window/Canvas API
const CanvasBackground = dynamic(() => import("@/components/CanvasBackground"), { 
  ssr: false 
})

type AppState = "room-logic" | "drop-zone"

export default function Home() {
  const [appState, setAppState] = useState<AppState>("room-logic")
  const [roomData, setRoomData] = useState<{ code: string; isHost: boolean } | null>(null)

  const handleScrollToApp = () => {
    document.getElementById("app")?.scrollIntoView({ behavior: "smooth" })
  }

  const handleJoinRoom = (code: string, isHost: boolean) => {
    setRoomData({ code, isHost })
    setAppState("drop-zone")
    // Ensure we are scrolled to the app section after joining
    setTimeout(() => {
      document.getElementById("app")?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  return (
    <main className="relative min-h-[200vh] w-full flex flex-col bg-[#0a0a0a]">
      {/* 
        Reactive Fabric layer is fixed behind the content and relies on mouse movement
      */}
      <CanvasBackground />

      <div className="relative z-10 w-full pointer-events-auto flex flex-col">
        {/* Landing Section (100vh) */}
        <LandingView onScrollToApp={handleScrollToApp} />

        {/* Application Core Section (100vh) */}
        <section id="app" className="min-h-screen py-24 px-6 md:px-12 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {appState === "room-logic" && (
              <RoomLogicView key="room-logic" onJoinRoom={handleJoinRoom} />
            )}
            {appState === "drop-zone" && roomData && (
              <DropZoneView key="drop-zone" roomCode={roomData.code} isHost={roomData.isHost} />
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  )
}
