"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Send, Loader2 } from "lucide-react";

const BRAND = "#007a5e";

type Phase = "idle" | "recording" | "transcribing" | "generating" | "done" | "error";

function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

function getExtension(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export default function NewEstimatePage() {
  const router = useRouter();
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [lang, setLang] = useState<"en" | "es">("en");

  const startRecording = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(250);
      mediaRef.current = recorder;
      setPhase("recording");

      // Wake lock — prevent screen sleep
      try { wakeLockRef.current = await navigator.wakeLock?.request("screen") ?? null; } catch { /**/ }
      // Haptic
      navigator.vibrate?.(40);
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    navigator.vibrate?.(40);
    const recorder = mediaRef.current;
    if (!recorder) return;

    recorder.onstop = async () => {
      // Release wake lock
      try { await wakeLockRef.current?.release(); } catch { /**/ }

      const mimeType = recorder.mimeType || getSupportedMimeType();
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const ext = getExtension(mimeType);
      const file = new File([blob], `recording.${ext}`, { type: mimeType });

      setPhase("transcribing");
      try {
        const fd = new FormData();
        fd.append("audio", file);
        fd.append("language", lang);

        const tRes = await fetch("/api/transcribe", { method: "POST", body: fd });
        const tJson = await tRes.json();
        if (!tRes.ok) throw new Error(tJson.error ?? "Transcription failed");

        const text: string = tJson.text;
        setTranscript(text);
        setPhase("generating");

        const gRes = await fetch("/api/estimates/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: text, language: lang }),
        });
        const gJson = await gRes.json();
        if (!gRes.ok) throw new Error(gJson.error ?? "Generation failed");

        setPhase("done");
        router.push(`/dashboard/estimates/${gJson.estimate.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setPhase("error");
      }
    };

    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());
    mediaRef.current = null;
  }, [lang, router]);

  const labels = {
    en: {
      title: "New Estimate",
      subtitle: "Record a job walkthrough. We'll build the estimate.",
      tap: "Tap to Record",
      recording: "Recording… tap to stop",
      transcribing: "Transcribing…",
      generating: "Building estimate…",
      done: "Done! Redirecting…",
      langLabel: "Language",
    },
    es: {
      title: "Nuevo Presupuesto",
      subtitle: "Graba un recorrido del trabajo. Nosotros hacemos el presupuesto.",
      tap: "Toca para Grabar",
      recording: "Grabando… toca para detener",
      transcribing: "Transcribiendo…",
      generating: "Creando presupuesto…",
      done: "¡Listo! Redirigiendo…",
      langLabel: "Idioma",
    },
  };
  const l = labels[lang];

  const statusLabel =
    phase === "idle" ? l.tap :
    phase === "recording" ? l.recording :
    phase === "transcribing" ? l.transcribing :
    phase === "generating" ? l.generating :
    phase === "done" ? l.done : error;

  const busy = phase === "transcribing" || phase === "generating" || phase === "done";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-2">{l.title}</h1>
          <p className="text-gray-500">{l.subtitle}</p>
        </div>

        {/* Language toggle */}
        <div className="flex justify-center mb-10">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
            {(["en", "es"] as const).map((l2) => (
              <button
                key={l2}
                onClick={() => setLang(l2)}
                className="px-5 py-2 text-sm font-bold transition-all"
                style={lang === l2 ? { background: BRAND, color: "white" } : { color: "#6b7280" }}
                disabled={busy}
              >
                {l2 === "en" ? "🇺🇸 EN" : "🇲🇽 ES"}
              </button>
            ))}
          </div>
        </div>

        {/* Record button */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={phase === "idle" || phase === "error" ? startRecording : phase === "recording" ? stopRecording : undefined}
            disabled={busy}
            className="w-32 h-32 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 disabled:opacity-50 touch-manipulation"
            style={{
              background: phase === "recording" ? "#dc2626" : BRAND,
              boxShadow: phase === "recording"
                ? "0 0 0 12px rgba(220,38,38,0.15)"
                : `0 0 0 12px rgba(0,122,94,0.1)`,
            }}
            aria-label={statusLabel}
          >
            {busy ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : phase === "recording" ? (
              <Square className="w-10 h-10 fill-white" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>

          <p className={`text-sm font-semibold text-center max-w-xs ${phase === "error" ? "text-red-500" : "text-gray-500"}`}>
            {statusLabel}
          </p>
        </div>

        {/* Transcript preview */}
        {transcript && (
          <div className="mt-10 p-4 rounded-xl bg-white border border-gray-200">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Transcript</p>
            <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* Retry */}
        {phase === "error" && (
          <div className="mt-6 text-center">
            <button
              onClick={() => { setPhase("idle"); setError(""); setTranscript(""); }}
              className="text-sm font-semibold underline"
              style={{ color: BRAND }}
            >
              Try again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
