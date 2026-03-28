"use client"

import { motion, Variants } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { MoreHorizontal } from "lucide-react"
import { OrbitDropCards } from "./OrbitDropCards"

interface LandingViewProps {
  onScrollToApp: () => void
}

export function LandingView({ onScrollToApp }: LandingViewProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1, delayChildren: 0.1 } 
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 100, damping: 20 } 
    }
  }

  return (
    <div className="relative w-full min-h-screen flex flex-col pt-6 pb-24 px-6 md:px-12 z-10 selection:bg-[#4F8EF7]/30">
      
      {/* Header */}
      <motion.header 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="w-full flex items-center justify-between mx-auto max-w-[1400px]"
      >
        <div className="flex items-center">
          <span className="font-serif text-2xl tracking-tight text-white">orbit</span>
          <span className="font-serif text-2xl tracking-tight text-[#4F8EF7]">drop</span>
        </div>

        <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
          <a href="#how" className="text-sm font-medium text-neutral-500 hover:text-white transition-colors">How it works</a>
          <a href="#github" className="text-sm font-medium text-neutral-500 hover:text-white transition-colors">GitHub</a>
          <a href="#docs" className="text-sm font-medium text-neutral-500 hover:text-white transition-colors">Docs</a>
        </nav>

        <div className="flex items-center space-x-3">
          <Button variant="secondary" className="rounded-full px-5 h-9 bg-black/40 border-white/10 hover:bg-white/10 hover:border-white/20 text-sm font-medium transition-all" onClick={onScrollToApp}>
            Get started
          </Button>
          <button className="h-9 w-10 flex items-center justify-center rounded-lg bg-black/40 border border-white/10 hover:bg-white/10 transition-colors text-neutral-400 hover:text-white">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </motion.header>

      {/* Hero Content */}
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col items-center justify-center text-center -mt-10"
      >
        {/* Pill */}
        <motion.div variants={itemVariants} className="mb-10 flex items-center space-x-3 bg-white/[0.03] border border-white/[0.08] rounded-full px-4 py-1.5 shadow-sm backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4F8EF7] shadow-[0_0_8px_rgba(79,142,247,0.8)]" />
          <span className="text-sm font-medium text-neutral-400 tracking-wide">WiFi-only &middot; No accounts &middot; Free</span>
        </motion.div>

        {/* Headlines */}
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center space-y-0 relative z-10 w-full">
          <h1 className="font-serif text-[5.5rem] md:text-[7rem] leading-[0.9] tracking-tight text-[#f3f4f6] drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            Drop it.
          </h1>
          <h1 className="font-serif italic text-[5.5rem] md:text-[7rem] leading-[0.9] tracking-tight text-[#4F8EF7] drop-shadow-[0_0_35px_rgba(79,142,247,0.4)] relative mt-4">
            Pick it up.
          </h1>
        </motion.div>

        {/* Description */}
        <motion.p variants={itemVariants} className="mt-8 text-neutral-400 font-sans text-lg md:text-xl font-light tracking-wide max-w-[400px] leading-relaxed mx-auto">
          Instant file sharing for everyone on your WiFi. No internet. No cloud. No friction.
        </motion.p>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="mt-4 w-full">
          <OrbitDropCards actionIntent={() => onScrollToApp()} />
        </motion.div>
      </motion.main>
      
    </div>
  )
}
