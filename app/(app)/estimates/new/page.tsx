"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type RecordingState = "idle" | "recording" | "stopped" | "transcribing" | "generating" | "error";

export default function NewEstimatePage() {
  const router = useRouter();
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(250);
      setState("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setErrorMsg("Microphone access denied. Please allow microphone access and try again.");
      setState("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      await transcribeAudio(blob);
    };

    mediaRecorderRef.current.stop();
    setState("transcribing");
  }, []);

  const transcribeAudio = async (blob: Blob) => {
    setState("transcribing");
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Transcription failed");

      setTranscript(json.transcript ?? "");
      setState("stopped");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Transcription failed");
      setState("error");
    }
  };

  const generateEstimate = async () => {
    if (!transcript.trim()) return;
    setState("generating");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/estimates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      router.push(`/estimates/${json.estimateId}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to generate estimate");
      setState("error");
    }
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Estimate</h1>
        <p className="text-sm text-gray-500 mt-1">Record a voice walkthrough — describe the job out loud and we&apos;ll build the estimate.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {/* IDLE */}
        {state === "idle" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="text-center">
              <p className="text-gray-600 text-sm max-w-sm mx-auto">
                Tap the mic and walk through the job — describe materials, scope, and any special conditions.
              </p>
            </div>
            <button
              onClick={startRecording}
              className="w-24 h-24 rounded-full bg-[#007a5e] hover:bg-[#006b52] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
              aria-label="Start recording"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </button>
            <p className="text-sm text-gray-400">Tap to start recording</p>
          </div>
        )}

        {/* RECORDING */}
        {state === "recording" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="text-center">
              <p className="text-sm text-gray-500 font-mono tabular-nums text-xl">{formatTime(elapsed)}</p>
              <p className="text-xs text-gray-400 mt-1">Recording…</p>
            </div>
            <button
              onClick={stopRecording}
              className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg record-pulse transition-all flex items-center justify-center"
              aria-label="Stop recording"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
            <p className="text-sm text-gray-400">Tap to stop</p>
          </div>
        )}

        {/* TRANSCRIBING */}
        {state === "transcribing" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-10 h-10 border-2 border-[#007a5e] border-t-transparent rounded-full spinner" />
            <p className="text-sm text-gray-600">Transcribing your recording…</p>
          </div>
        )}

        {/* STOPPED — transcript review */}
        {state === "stopped" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transcript — review before generating</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={8}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#007a5e]/30 focus:border-[#007a5e] resize-none"
                placeholder="Your transcript will appear here…"
              />
              <p className="text-xs text-gray-400 mt-1">Edit the transcript if anything was misheard before generating.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setState("idle"); setTranscript(""); }}
                className="h-10 px-4 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Re-record
              </button>
              <button
                onClick={generateEstimate}
                disabled={!transcript.trim()}
                className="flex-1 h-10 text-sm font-medium bg-[#007a5e] hover:bg-[#006b52] disabled:opacity-50 text-white rounded-xl transition-colors"
              >
                Generate Estimate
              </button>
            </div>
          </div>
        )}

        {/* GENERATING */}
        {state === "generating" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-10 h-10 border-2 border-[#007a5e] border-t-transparent rounded-full spinner" />
            <p className="text-sm text-gray-600">Building your estimate…</p>
            <p className="text-xs text-gray-400">Identifying line items, materials, and pricing</p>
          </div>
        )}

        {/* ERROR */}
        {state === "error" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {errorMsg ?? "Something went wrong. Please try again."}
            </div>
            <button
              onClick={() => setState("idle")}
              className="h-10 px-6 text-sm font-medium bg-[#007a5e] hover:bg-[#006b52] text-white rounded-xl transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Speak naturally — mention trade terms, quantities, and any special conditions. The more detail, the better.
      </p>
    </div>
  );
}
