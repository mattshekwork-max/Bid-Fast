import { Polar } from "@polar-sh/sdk";

// Check if Polar is configured
export function isPolarConfigured(): boolean {
  return !!process.env.POLAR_ACCESS_TOKEN;
}

// Only initialize Polar if configured
export const polar = isPolarConfigured()
  ? new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN!,
      server:
        (process.env.POLAR_ENVIRONMENT as "sandbox" | "production") ||
        "sandbox",
    })
  : null;
