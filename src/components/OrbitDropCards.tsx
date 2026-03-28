"use client";

import React, { useEffect, useId, useState } from "react";

interface OrbitDropCardsProps {
  /** Fired on second click on the Create Room card (after expand). */
  onSecondClickCreate?: () => void;
  /** Fired on second click on the Join Room card (after expand). */
  onSecondClickJoin?: () => void;
}

export function OrbitDropCards({
  onSecondClickCreate,
  onSecondClickJoin,
}: OrbitDropCardsProps) {
  const [activeState, setActiveState] = useState<null | "create" | "join">(
    null,
  );
  const patternId = useId().replace(/:/g, "");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-card="true"]')) {
        setActiveState(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCardClick = (
    e: React.MouseEvent,
    type: "create" | "join",
  ) => {
    e.stopPropagation();
    if (activeState === type) {
      if (type === "create" && onSecondClickCreate) onSecondClickCreate();
      else if (type === "join" && onSecondClickJoin) onSecondClickJoin();
    } else {
      setActiveState(type);
    }
  };

  const inactiveScale = 0.56;
  /** Extra horizontal push so the small card sits farther from the focused one (was ±80px). */
  const inactiveTranslateX = 118;

  const getCard1Transform = () => {
    if (activeState === "create")
      return "rotate(-2deg) translateX(-30px) translateY(30px) scale(1.3)";
    if (activeState === "join")
      return `rotate(-32deg) translateX(-${inactiveTranslateX}px) scale(${inactiveScale})`;
    return "rotate(-28deg) translateX(-70px)";
  };

  const getCard2Transform = () => {
    if (activeState === "create")
      return `rotate(32deg) translateX(${inactiveTranslateX}px) scale(${inactiveScale})`;
    if (activeState === "join")
      return "rotate(2deg) translateX(30px) translateY(30px) scale(1.3)";
    return "rotate(22deg) translateX(70px)";
  };

  const cardStyle: React.CSSProperties = {
    transition: "transform 0.8s cubic-bezier(0.34, 1.3, 0.64, 1)",
    transformOrigin: "50% 100%",
  };

  /** Light blur; rim visible but softer than the heavy pass. */
  const glassSurfaceClass =
    "border border-white/[0.18] bg-[rgba(8,10,14,0.22)] shadow-[0_16px_48px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm backdrop-saturate-125";

  const pid1 = `v-lines-a-${patternId}`;

  return (
    <div className="relative mx-auto -mt-8 flex h-[460px] w-full justify-center">
      <div
        data-card="true"
        onClick={(e) => handleCardClick(e, "create")}
        className={`absolute bottom-[60px] left-1/2 -ml-[120px] flex h-[320px] w-[240px] cursor-pointer select-none flex-col justify-end overflow-hidden rounded-[28px] ${glassSurfaceClass}`}
        style={{
          ...cardStyle,
          zIndex: 1,
          transform: getCard1Transform(),
        }}
      >
        <div className="pointer-events-none absolute left-0 top-0 h-[62%] w-full overflow-hidden border-b border-white/15 opacity-42">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id={pid1}
                width="7"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="10"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${pid1})`} />
            <circle
              cx="50%"
              cy="50%"
              r="42"
              fill="none"
              stroke="#4F8EF7"
              strokeWidth="1"
              opacity="0.6"
            />
            <circle
              cx="50%"
              cy="50%"
              r="64"
              fill="none"
              stroke="#4F8EF7"
              strokeWidth="0.5"
              opacity="0.4"
            />
            <line
              x1="0"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke="white"
              strokeWidth="0.5"
              opacity="0.3"
            />
            <line
              x1="50%"
              y1="0"
              x2="50%"
              y2="100%"
              stroke="white"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </svg>
        </div>
        <div className="relative z-10 flex h-[38%] flex-col justify-end px-[22px] pb-[24px] pointer-events-none">
          <div className="text-[10px] uppercase tracking-[0.14em] text-white opacity-65">
            Orbit Drop
          </div>
          <div
            className="mb-2 mt-1 text-[23px] font-medium italic leading-[1.2] text-white"
            style={{ fontFamily: "var(--font-newsreader), serif" }}
          >
            Create Room
          </div>
          <div
            className={`text-[12px] leading-[1.55] text-[#ccc] transition-all duration-500 ease-in-out ${
              activeState === "create"
                ? "mt-2 max-h-[80px] opacity-75"
                : "max-h-0 overflow-hidden opacity-0"
            }`}
          >
            Spin up a local node. Anyone on your Wi-Fi can connect instantly —
            no accounts, no internet.
          </div>
        </div>
      </div>

      <div
        data-card="true"
        onClick={(e) => handleCardClick(e, "join")}
        className={`absolute bottom-[60px] left-1/2 -ml-[120px] flex h-[320px] w-[240px] cursor-pointer select-none flex-col justify-end overflow-hidden rounded-[28px] ${glassSurfaceClass}`}
        style={{
          ...cardStyle,
          zIndex: 2,
          transform: getCard2Transform(),
        }}
      >
        <div className="pointer-events-none absolute left-0 top-0 h-[62%] w-full overflow-hidden border-b border-white/15 opacity-42">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <rect x="10%" y="15%" width="80%" height="8%" rx="2" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <rect x="10%" y="30%" width="38%" height="30%" rx="3" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <rect x="52%" y="30%" width="38%" height="30%" rx="3" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <rect x="10%" y="68%" width="80%" height="6%" rx="2" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <rect x="10%" y="78%" width="50%" height="6%" rx="2" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx="50%" cy="45%" r="18" fill="rgba(10,10,14,0.35)" stroke="#4F8EF7" strokeWidth="1.5" />
            <path
              d="M112 85 l5 5 l10 -10"
              fill="none"
              stroke="#4F8EF7"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="relative z-10 flex h-[38%] flex-col justify-end px-[22px] pb-[24px] pointer-events-none">
          <div className="text-[10px] uppercase tracking-[0.14em] text-white opacity-65">
            Orbit Drop
          </div>
          <div
            className="mb-2 mt-1 text-[23px] font-medium italic leading-[1.2] text-white"
            style={{ fontFamily: "var(--font-newsreader), serif" }}
          >
            Join Room
          </div>
          <div
            className={`text-[12px] leading-[1.55] text-[#ccc] transition-all duration-500 ease-in-out ${
              activeState === "join"
                ? "mt-2 max-h-[80px] opacity-75"
                : "max-h-0 overflow-hidden opacity-0"
            }`}
          >
            Enter a room code or scan the QR. Drop in, grab files at full LAN
            speed.
          </div>
        </div>
      </div>
    </div>
  );
}
