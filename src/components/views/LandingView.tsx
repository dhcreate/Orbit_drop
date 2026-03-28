"use client";

import { motion, type Variants } from "framer-motion";
import { Mail } from "lucide-react";
import { KeyFeatures } from "@/components/KeyFeatures";
import { OrbitDropCards } from "@/components/OrbitDropCards";

const ORBIT_GITHUB_URL = "https://github.com/dhcreate/Orbit_drop";
const ORBIT_CONTACT_EMAIL = "dashboard.orbit@gmail.com";

const headerPillClass =
  "inline-flex shrink-0 items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-neutral-400 shadow-[0_4px_24px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-colors hover:border-[#4F8EF7]/30 hover:text-[#4F8EF7] md:px-4";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

interface LandingViewProps {
  lobby: {
    openCreate: (via: "card" | "choice") => void;
    openJoin: (via: "card" | "choice") => void;
  };
}

export function LandingView({ lobby }: LandingViewProps) {
  const year = new Date().getFullYear();

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
    <div className="relative z-10 flex min-h-screen w-full flex-col px-6 pt-6 selection:bg-[#4F8EF7]/30 md:px-12">
      <motion.header
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4"
      >
        <div className="flex items-center">
          <span className="font-serif text-3xl tracking-tight text-white md:text-4xl">
            orbit
          </span>
          <span className="font-serif text-3xl tracking-tight text-[#4F8EF7] md:text-4xl">
            drop
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <a
            href={`mailto:${ORBIT_CONTACT_EMAIL}`}
            className={headerPillClass}
            aria-label={`Email Orbit at ${ORBIT_CONTACT_EMAIL}`}
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-xs font-medium tracking-wide md:text-sm">
              Contact us
            </span>
          </a>
          <a
            href={ORBIT_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={headerPillClass}
            aria-label="View Orbit Drop on GitHub"
          >
            <GitHubIcon className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium tracking-wide md:text-sm">
              GitHub
            </span>
          </a>
        </div>
      </motion.header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-1 flex-col items-center justify-start text-center pt-10 md:pt-20 lg:pt-28"
      >
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
          className="mx-auto mt-8 max-w-[26rem] font-sans text-base font-light leading-relaxed tracking-[0.06em] text-neutral-400 md:max-w-[28rem] md:text-lg"
        >
          No gate, no compression—just your files, exact and many, a thin pulse
          of progress on the bar. The room orbits while you host it; a day later,
          the trail goes cold.
        </motion.p>

        <motion.div variants={itemVariants} className="mt-10 w-full md:mt-12">
          <OrbitDropCards
            onSecondClickCreate={() => lobby.openCreate("card")}
            onSecondClickJoin={() => lobby.openJoin("card")}
          />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mx-auto mt-14 w-full max-w-5xl px-0 text-left md:mt-20"
        >
          <KeyFeatures />
        </motion.div>
      </motion.main>

      <footer className="mt-auto flex justify-center px-2 pb-8 pt-12">
        <div className="flex items-center gap-4 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-sm">
          <p className="text-[11px] font-medium tracking-wide text-neutral-500">
            © {year} Orbit
          </p>
          <span className="h-3 w-px bg-white/15" aria-hidden />
          <a
            href={ORBIT_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-neutral-400 transition-colors hover:text-[#4F8EF7]"
            aria-label="Orbit Drop on GitHub"
          >
            <GitHubIcon className="h-4 w-4 shrink-0" />
            <span className="text-[11px] font-medium tracking-wide">GitHub</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
