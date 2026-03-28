"use client";

import { motion, type Variants } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OrbitDropCards } from "@/components/OrbitDropCards";

interface LandingViewProps {
  lobby: {
    openChoice: () => void;
    openCreate: (via: "card" | "choice") => void;
    openJoin: (via: "card" | "choice") => void;
  };
}

export function LandingView({ lobby }: LandingViewProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col px-6 pb-24 pt-6 selection:bg-[#4F8EF7]/30 md:px-12">
      <motion.header
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto flex w-full max-w-[1400px] items-center justify-between"
      >
        <div className="flex items-center">
          <span className="font-serif text-2xl tracking-tight text-white">
            orbit
          </span>
          <span className="font-serif text-2xl tracking-tight text-[#4F8EF7]">
            drop
          </span>
        </div>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center space-x-8 md:flex">
          <a
            href="#how"
            className="text-sm font-medium text-neutral-500 transition-colors hover:text-white"
          >
            How it works
          </a>
          <a
            href="#github"
            className="text-sm font-medium text-neutral-500 transition-colors hover:text-white"
          >
            GitHub
          </a>
          <a
            href="#docs"
            className="text-sm font-medium text-neutral-500 transition-colors hover:text-white"
          >
            Docs
          </a>
        </nav>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            className="h-9 rounded-full border-white/10 bg-black/40 px-5 text-sm font-medium transition-all hover:border-white/20 hover:bg-white/10"
            onClick={() => lobby.openChoice()}
          >
            Get started
          </Button>
          <button
            type="button"
            className="flex h-9 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </motion.header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="-mt-10 flex flex-1 flex-col items-center justify-center text-center"
      >
        <motion.div
          variants={itemVariants}
          className="mb-10 flex items-center space-x-3 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 shadow-sm backdrop-blur-sm"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-[#4F8EF7] shadow-[0_0_8px_rgba(79,142,247,0.8)]" />
          <span className="text-sm font-medium tracking-wide text-neutral-400">
            WiFi-only &middot; No accounts &middot; Free
          </span>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="relative z-10 flex w-full flex-col items-center justify-center space-y-0"
        >
          <h1 className="font-serif text-[5.5rem] leading-[0.9] tracking-tight text-[#f3f4f6] drop-shadow-[0_0_15px_rgba(255,255,255,0.05)] md:text-[7rem]">
            Drop it.
          </h1>
          <h1 className="relative mt-4 font-serif text-[5.5rem] italic leading-[0.9] tracking-tight text-[#4F8EF7] drop-shadow-[0_0_35px_rgba(79,142,247,0.4)] md:text-[7rem]">
            Pick it up.
          </h1>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="mx-auto mt-8 max-w-[400px] font-sans text-lg font-light leading-relaxed tracking-wide text-neutral-400 md:text-xl"
        >
          Instant file sharing for everyone on your WiFi. No internet. No cloud.
          No friction.
        </motion.p>

        <motion.div variants={itemVariants} className="mt-4 w-full">
          <OrbitDropCards
            onSecondClickCreate={() => lobby.openCreate("card")}
            onSecondClickJoin={() => lobby.openJoin("card")}
          />
        </motion.div>
      </motion.main>
    </div>
  );
}
