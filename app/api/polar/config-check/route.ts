import { NextResponse } from "next/server";
import { isPolarConfigured } from "@/lib/polar";

// GET /api/polar/config-check
// Returns whether Polar is properly configured
export async function GET() {
  return NextResponse.json({
    configured: isPolarConfigured(),
  });
}
