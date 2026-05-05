import { NextRequest, NextResponse } from "next/server";
import { summarizeLead } from "@/lib/ai/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, company, message } = body;

    if (!name || !message) {
      return NextResponse.json(
        { error: "name and message are required" },
        { status: 400 }
      );
    }

    const result = await summarizeLead({
      name,
      company: company || "",
      message,
    });

    return NextResponse.json({ summary: result });
  } catch (error) {
    console.error("[AI Summarize] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}