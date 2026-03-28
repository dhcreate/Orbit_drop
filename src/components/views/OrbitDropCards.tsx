"use client"

import React, { useState, useEffect } from 'react'

interface OrbitDropCardsProps {
  actionIntent?: (intent: 'create' | 'join') => void
}

export function OrbitDropCards({ actionIntent }: OrbitDropCardsProps) {
  const [activeState, setActiveState] = useState<null | 'create' | 'join'>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-card="true"]')) {
        setActiveState(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCardClick = (e: React.MouseEvent, type: 'create' | 'join') => {
    e.stopPropagation()
    if (activeState === type) {
      if (actionIntent) actionIntent(type)
    } else {
      setActiveState(type)
    }
  }

  // Transform generators based on state
  const getCard1Transform = () => {
    if (activeState === 'create') return 'rotate(-2deg) translateX(-30px) translateY(30px) scale(1.3)'
    if (activeState === 'join') return 'rotate(-32deg) translateX(-80px) scale(0.8)'
    return 'rotate(-28deg) translateX(-70px)'
  }

  const getCard2Transform = () => {
    if (activeState === 'create') return 'rotate(32deg) translateX(80px) scale(0.8)'
    if (activeState === 'join') return 'rotate(2deg) translateX(30px) translateY(30px) scale(1.3)'
    return 'rotate(22deg) translateX(70px)'
  }

  return (
    <div className="relative w-full h-[460px] mx-auto flex justify-center -mt-8">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;1,500&display=swap');
      ` }} />
      
      {/* Card 1: Create Room */}
      <div 
        data-card="true"
        onClick={(e) => handleCardClick(e, 'create')}
        className="absolute bottom-[60px] left-1/2 -ml-[120px] w-[240px] h-[320px] rounded-[28px] overflow-hidden flex flex-col justify-end bg-[var(--color-card,rgba(30,30,30,0.9))] cursor-pointer select-none"
        style={{
          zIndex: 1,
          transformOrigin: '50% 100%',
          transform: getCard1Transform(),
          transition: 'transform 0.8s cubic-bezier(0.34, 1.3, 0.64, 1)',
          WebkitBackdropFilter: 'blur(10px)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* SVG Texture Zone: Top 62% */}
        <div className="absolute top-0 left-0 w-full h-[62%] overflow-hidden pointer-events-none opacity-80 border-b border-[var(--color-border,rgba(255,255,255,0.05))]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="v-lines" width="7" height="10" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#v-lines)" />
            <circle cx="50%" cy="50%" r="42" fill="none" stroke="var(--color-primary, #4F8EF7)" strokeWidth="1" opacity="0.6" />
            <circle cx="50%" cy="50%" r="64" fill="none" stroke="var(--color-primary, #4F8EF7)" strokeWidth="0.5" opacity="0.4" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="var(--color-foreground, #fff)" strokeWidth="0.5" opacity="0.3" />
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="var(--color-foreground, #fff)" strokeWidth="0.5" opacity="0.3" />
          </svg>
        </div>

        {/* Text Zone */}
        <div className="relative z-10 flex flex-col justify-end px-[22px] pb-[24px] pointer-events-none h-[38%]">
          <div className="text-[10px] tracking-[0.14em] uppercase opacity-65 font-[-apple-system,sans-serif] text-[var(--color-foreground,#fff)]">Orbit Drop</div>
          <div className="text-[23px] font-medium leading-[1.2] mt-1 mb-2 text-[var(--color-foreground,#fff)]" style={{ fontFamily: "'Playfair Display', serif" }}>Create Room</div>
          <div className={`text-[12px] leading-[1.55] font-sans text-[var(--color-foreground,#ccc)] transition-all duration-500 ease-in-out ${activeState === 'create' ? 'opacity-75 max-h-[80px] mt-2' : 'opacity-0 max-h-0 overflow-hidden'}`}>
            Spin up a local node. Anyone on your Wi-Fi can connect instantly — no accounts, no internet.
          </div>
        </div>
      </div>

      {/* Card 2: Join Room */}
      <div 
        data-card="true"
        onClick={(e) => handleCardClick(e, 'join')}
        className="absolute bottom-[60px] left-1/2 -ml-[120px] w-[240px] h-[320px] rounded-[28px] overflow-hidden flex flex-col justify-end bg-[var(--color-card,rgba(30,30,30,0.9))] cursor-pointer select-none"
        style={{
          zIndex: 2,
          transformOrigin: '50% 100%',
          transform: getCard2Transform(),
          transition: 'transform 0.8s cubic-bezier(0.34, 1.3, 0.64, 1)',
          WebkitBackdropFilter: 'blur(10px)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* SVG Texture Zone: Top 62% */}
        <div className="absolute top-0 left-0 w-full h-[62%] overflow-hidden pointer-events-none opacity-80 border-b border-[var(--color-border,rgba(255,255,255,0.05))]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect x="10%" y="15%" width="80%" height="8%" rx="2" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <rect x="10%" y="30%" width="38%" height="30%" rx="3" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <rect x="52%" y="30%" width="38%" height="30%" rx="3" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <rect x="10%" y="68%" width="80%" height="6%" rx="2" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <rect x="10%" y="78%" width="50%" height="6%" rx="2" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            
            <circle cx="50%" cy="45%" r="18" fill="var(--color-background, #0a0a0a)" stroke="var(--color-primary, #4F8EF7)" strokeWidth="1.5" />
            <path d="M112 85 l5 5 l10 -10" fill="none" stroke="var(--color-primary, #4F8EF7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Text Zone */}
        <div className="relative z-10 flex flex-col justify-end px-[22px] pb-[24px] pointer-events-none h-[38%]">
          <div className="text-[10px] tracking-[0.14em] uppercase opacity-65 font-[-apple-system,sans-serif] text-[var(--color-foreground,#fff)]">Orbit Drop</div>
          <div className="text-[23px] font-medium leading-[1.2] mt-1 mb-2 text-[var(--color-foreground,#fff)]" style={{ fontFamily: "'Playfair Display', serif" }}>Join Room</div>
          <div className={`text-[12px] leading-[1.55] font-sans text-[var(--color-foreground,#ccc)] transition-all duration-500 ease-in-out ${activeState === 'join' ? 'opacity-75 max-h-[80px] mt-2' : 'opacity-0 max-h-0 overflow-hidden'}`}>
            Enter a room code or scan the QR. Drop in, grab files at full LAN speed.
          </div>
        </div>
      </div>
    </div>
  )
}
