"use client";

import { useMemo } from "react";

interface UserAvatarProps {
  username: string;
  size?: "xs" | "sm" | "md";
  showName?: boolean;
  isYou?: boolean;
  color?: string;
}

function getUserColor(name: string): string {
  const colors = [
    "#4F8EF7",
    "#34D399",
    "#A78BFA",
    "#F472B6",
    "#FB923C",
    "#38BDF8",
    "#4ADE80",
    "#E879F9",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length]!;
}

export function getUserColorForName(name: string): string {
  return getUserColor(name || "Unknown");
}

const dotSizeClasses = {
  xs: "h-1.5 w-1.5",
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
} as const;

export function UserAvatar({
  username,
  size = "md",
  showName = false,
  isYou = false,
  color: overrideColor,
}: UserAvatarProps) {
  const displayName = username || "?";
  const color = useMemo(
    () => overrideColor || getUserColor(displayName),
    [displayName, overrideColor],
  );
  const initial = displayName.charAt(0).toUpperCase();

  const sizeClasses = {
    xs: "h-5 w-5 text-[8px] sm:h-5 sm:w-5 sm:text-[9px]",
    sm: "h-6 w-6 text-[10px]",
    md: "h-7 w-7 text-xs sm:h-8 sm:w-8",
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div
        className={`relative ${sizeClasses[size]} flex flex-shrink-0 items-center justify-center rounded-full font-bold`}
        style={{
          backgroundColor: `${color}33`,
          border: `1.5px solid ${color}66`,
          color,
        }}
      >
        <span className="leading-none">{initial}</span>
        <div
          className={`absolute -bottom-[1px] -right-[1px] rounded-full border border-[#0a0a0a] ${dotSizeClasses[size]}`}
          style={{ backgroundColor: color }}
          aria-hidden
        />
      </div>
      {showName ? (
        <span className="max-w-[60px] truncate text-[10px] font-medium text-neutral-300 sm:max-w-none sm:text-xs">
          {displayName}
          {isYou ? (
            <span className="ml-1 text-[9px] text-neutral-500 sm:text-[10px]">
              (you)
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
