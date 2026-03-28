"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { Tabs } from "@/components/ui/Tabs"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { HostelServices } from "@/lib/services"
import { Loader2 } from "lucide-react"

interface RoomLogicViewProps {
  onJoinRoom: (code: string, isHost: boolean) => void
}

export function RoomLogicView({ onJoinRoom }: RoomLogicViewProps) {
  const [activeTab, setActiveTab] = useState("create")
  
  // Create State
  const [isCreating, setIsCreating] = useState(false)
  const [createdCode, setCreatedCode] = useState<string | null>(null)

  // Join State
  const [joinCode, setJoinCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setIsCreating(true)
    const res = await HostelServices.createRoom()
    setCreatedCode(res.code)
    setIsCreating(false)
  }

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (joinCode.length !== 6) return
    setIsJoining(true)
    setError(null)
    
    try {
      const res = await HostelServices.joinRoom(joinCode)
      onJoinRoom(res.code, res.isHost)
    } catch {
      setError("Room not found or expired.")
      setIsJoining(false)
    }
  }

  const renderCreate = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center space-y-6 pt-4"
    >
      {!createdCode ? (
        <Button onClick={handleCreate} disabled={isCreating} className="w-full h-14 text-lg">
          {isCreating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Generate Room
        </Button>
      ) : (
        <div className="flex flex-col items-center space-y-4 w-full">
          <label className="text-sm text-neutral-400 font-medium">Your Room Code</label>
          <div className="w-full bg-black/50 border border-[#4F8EF7]/30 rounded-xl py-6 flex justify-center items-center shadow-[0_0_30px_rgba(79,142,247,0.15)]">
            <span className="font-mono text-4xl tracking-[0.2em] text-[#4F8EF7] drop-shadow-[0_0_12px_rgba(79,142,247,0.8)]">
              {createdCode}
            </span>
          </div>
          <Button onClick={() => onJoinRoom(createdCode, true)} className="w-full h-14 mt-4">
            Enter Room
          </Button>
        </div>
      )}
    </motion.div>
  )

  const renderJoin = () => (
    <motion.form 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onSubmit={handleJoinSubmit}
      className="flex flex-col space-y-4 pt-4"
    >
      <div className="space-y-2 relative">
        <label className="text-sm text-neutral-400 font-medium">Enter 6-Digit Code</label>
        <Input 
          type="text" 
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="XXXXXX"
          className="font-mono text-2xl tracking-[0.2em] uppercase text-center h-16"
          disabled={isJoining}
        />
        {error && <span className="text-red-400 text-sm absolute -bottom-6 left-0">{error}</span>}
      </div>
      <Button 
        type="submit" 
        disabled={joinCode.length !== 6 || isJoining} 
        className="w-full h-14 mt-6"
      >
        {isJoining ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Connect to Room"}
      </Button>
    </motion.form>
  )

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="p-8 pb-10 flex flex-col space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif text-white">Join the Fabric</h2>
          <p className="text-sm text-neutral-400">Create a secure drop or enter a code.</p>
        </div>
        
        <Tabs 
          tabs={[{ id: "create", label: "Create" }, { id: "join", label: "Join" }]} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
        
        <div className="min-h-[160px]">
          <AnimatePresence mode="wait">
             {activeTab === "create" ? (
               <motion.div key="create">{renderCreate()}</motion.div>
             ) : (
               <motion.div key="join">{renderJoin()}</motion.div>
             )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
}
