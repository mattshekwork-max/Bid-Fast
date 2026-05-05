// Demo workspace ID — replace with real auth when wired up
export const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

// Urgency color scale
export function getUrgencyColor(score: number | null): {
  bg: string;
  text: string;
  border: string;
  glow: string;
  pulse: boolean;
} {
  if (!score) return { bg: "bg-slate-700", text: "text-slate-300", border: "border-slate-600", glow: "", pulse: false };
  if (score <= 3) return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", glow: "", pulse: false };
  if (score <= 6) return { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", glow: "", pulse: false };
  if (score <= 8) return { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30", glow: "", pulse: false };
  return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", glow: "shadow-red-500/40 shadow-lg animate-pulse", pulse: true };
}

export function getUrgencyLabel(score: number | null): string {
  if (!score) return "Unscored";
  if (score <= 3) return "Low";
  if (score <= 6) return "Medium";
  if (score <= 8) return "High";
  return "Critical";
}

export function getSourceBadge(source: string): { label: string; icon: string; bg: string; text: string } {
  switch (source) {
    case "email":
      return { label: "Email", icon: "Mail", bg: "bg-sky-500/15", text: "text-sky-400" };
    case "missed_call":
      return { label: "Missed Call", icon: "PhoneMissed", bg: "bg-amber-500/15", text: "text-amber-400" };
    case "text":
      return { label: "Text", icon: "MessageSquare", bg: "bg-violet-500/15", text: "text-violet-400" };
    case "manual":
      return { label: "Manual", icon: "UserPlus", bg: "bg-slate-500/15", text: "text-slate-400" };
    default:
      return { label: source, icon: "Circle", bg: "bg-slate-500/15", text: "text-slate-400" };
  }
}

export function getIntentBadge(intent: string | null): { label: string; bg: string; text: string } | null {
  if (!intent) return null;
  switch (intent.toLowerCase()) {
    case "hot":
    case "buying":
    case "urgent":
      return { label: intent, bg: "bg-red-500/15", text: "text-red-400" };
    case "warm":
    case "interested":
    case "considering":
      return { label: intent, bg: "bg-amber-500/15", text: "text-amber-400" };
    case "cold":
    case "browsing":
    case "info":
      return { label: intent, bg: "bg-slate-500/15", text: "text-slate-400" };
    default:
      return { label: intent, bg: "bg-teal-500/15", text: "text-teal-400" };
  }
}