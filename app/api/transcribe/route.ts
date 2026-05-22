import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const languageField = formData.get("language") as string | null;

    if (!audio) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const language = languageField === "es" ? "es" : "en";

    const groqForm = new FormData();
    groqForm.append("file", audio);
    groqForm.append("model", "whisper-large-v3");
    groqForm.append("language", language);
    groqForm.append("response_format", "json");

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: groqForm,
    });

    if (!groqRes.ok) {
      console.error("Groq transcription error:", await groqRes.text());
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }

    const transcription = await groqRes.json();
    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    console.error("Transcription error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
