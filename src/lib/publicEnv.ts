/**
 * Client-safe configuration for production deployments.
 * Set in Vercel/hosting: NEXT_PUBLIC_CONVEX_URL (required).
 */
export const publicEnv = {
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ?? "",
  nodeEnv: process.env.NODE_ENV as "development" | "production" | "test",
  isProduction: process.env.NODE_ENV === "production",
} as const;
