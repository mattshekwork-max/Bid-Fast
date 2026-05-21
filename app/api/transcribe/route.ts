import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// NOTE: Requires GROQ_API_KEY environment variable

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY is not configured" }, { status: 500 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const audio = formData.get("audio") as File | null;
  if (!audio) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  try {
    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: "whisper-large-v3-turbo",
      response_format: "json",
      language: "en",
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
