"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, useMemo } from "react";
import { publicEnv } from "@/lib/publicEnv";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const url = publicEnv.convexUrl;
    if (!url) {
      const hint = publicEnv.isProduction
        ? "Set NEXT_PUBLIC_CONVEX_URL in your hosting provider (e.g. Vercel) to your Convex deployment URL."
        : "Add NEXT_PUBLIC_CONVEX_URL to .env.local.";
      throw new Error(`NEXT_PUBLIC_CONVEX_URL is not set. ${hint}`);
    }
    return new ConvexReactClient(url);
  }, []);

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
