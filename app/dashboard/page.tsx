"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  PhoneMissed,
  MessageSquare,
  UserPlus,
  Circle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Clock,
  Building2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useQueue } from "@/lib/hooks/use-queue";
import { useUpdateLeadStatus } from "@/lib/hooks/use-leads";
import { DEMO_WORKSPACE_ID, getUrgencyColor, getUrgencyLabel, getSourceBadge, getIntentBadge } from "@/lib/constants";
import type { QueueLead } from "@/lib/hooks/use-queue";
import { formatDistanceToNow } from "date-fns";

// Animation variants
const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function SourceIcon({ source }: { source: string }) {
  const badge = getSourceBadge(source);
  const icons: Record<string, React.ReactNode> = {
    Mail: <Mail size={12} />,
    PhoneMissed: <PhoneMissed size={12} />,
    MessageSquare: <MessageSquare size={12} />,
    UserPlus: <UserPlus size={12} />,
    Circle: <Circle size={12} />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
      {icons[badge.icon]}
      {badge.label}
    </span>
  );
}

function UrgencyBadge({ score }: { score: number | null }) {
  const { bg, text, glow } = getUrgencyColor(score);
  const label = getUrgencyLabel(score);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${bg} ${text} ${glow}`}>
      <AlertTriangle size={10} />
      {score ?? "—"} {label}
    </span>
  );
}

function IntentBadge({ intent }: { intent: string | null }) {
  const badge = getIntentBadge(intent);
  if (!badge) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
      {badge.label}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "—";
  }
}

function LeadCard({ lead, onExpand }: { lead: QueueLead; onExpand: (id: string) => void }) {
  const updateStatus = useUpdateLeadStatus();
  const [copied, setCopied] = useState(false);

  const handleContacted = () => {
    updateStatus.mutate({ leadId: lead.id, status: "contacted" });
  };

  const handleDismiss = () => {
    updateStatus.mutate({ leadId: lead.id, status: "lost" });
  };

  const handleCopyReply = () => {
    if (lead.suggested_reply) {
      navigator.clipboard.writeText(lead.suggested_reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      layout
      className={`group relative bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all hover:shadow-lg ${
        lead.urgency_score && lead.urgency_score >= 9 ? "border-red-500/30 hover:border-red-500/50" : ""
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Left: Avatar */}
        <div className="shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
            lead.urgency_score && lead.urgency_score >= 9
              ? "bg-red-500/20 text-red-400"
              : lead.urgency_score && lead.urgency_score >= 7
              ? "bg-orange-500/20 text-orange-400"
              : "bg-slate-800 text-slate-400"
          }`}>
            {lead.name ? lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
          </div>
        </div>

        {/* Center: Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Row 1: Name, badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/leads/${lead.id}`}
              className="font-semibold text-sm text-slate-100 hover:text-teal-400 transition-colors truncate max-w-[200px]"
            >
              {lead.name || "Unknown Lead"}
            </Link>
            {lead.company && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <Building2 size={10} />
                {lead.company}
              </span>
            )}
            <SourceIcon source={lead.source} />
            <UrgencyBadge score={lead.urgency_score} />
            <IntentBadge intent={lead.intent} />
          </div>

          {/* Row 2: Summary */}
          {lead.summary && (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              {lead.summary}
            </p>
          )}

          {/* Row 3: Suggested reply */}
          {lead.suggested_reply && (
            <div className="flex items-start gap-2 text-xs">
              <span className="text-teal-500 shrink-0 mt-0.5">↳</span>
              <p className="text-slate-500 line-clamp-1 flex-1 italic">
                "{lead.suggested_reply}"
              </p>
              <button
                onClick={handleCopyReply}
                className="shrink-0 p-1 text-slate-500 hover:text-teal-400 transition-colors"
                title="Copy suggested reply"
              >
                {copied ? <Check size={12} className="text-teal-400" /> : <Copy size={12} />}
              </button>
            </div>
          )}

          {/* Row 4: Meta */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
            <span className="inline-flex items-center gap-1">
              <Clock size={10} />
              {timeAgo(lead.last_activity_at)}
            </span>
            {lead.pending_follow_ups > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-500">
                <AlertTriangle size={10} />
                {lead.pending_follow_ups} pending
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex sm:flex-col gap-2 shrink-0">
          <button
            onClick={handleContacted}
            disabled={updateStatus.isPending}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600/15 text-teal-400 hover:bg-teal-600/25 transition-colors disabled:opacity-50"
          >
            <Check size={13} />
            Contacted
          </button>
          <button
            onClick={handleDismiss}
            disabled={updateStatus.isPending}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            <X size={13} />
            Dismiss
          </button>
          <Link
            href={`/dashboard/leads/${lead.id}`}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
          >
            <ChevronDown size={13} />
            Expand
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-teal-600/15 flex items-center justify-center mb-4">
        <Check size={28} className="text-teal-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-200 mb-2">
        No missed opportunities. Nice work! 🎉
      </h3>
      <p className="text-sm text-slate-500 max-w-md">
        Your follow-up queue is empty. When new leads come in, they&apos;ll appear here sorted by urgency.
      </p>
    </motion.div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-200 mb-2">Something went wrong</h3>
      <p className="text-sm text-slate-500 mb-4">Could not load your follow-up queue.</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
      >
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-800" />
            <div className="flex-1 space-y-2.5">
              <div className="h-3.5 bg-slate-800 rounded w-48" />
              <div className="h-3 bg-slate-800 rounded w-64" />
              <div className="h-2.5 bg-slate-800 rounded w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function QueuePage() {
  const { data, isLoading, isError, refetch } = useQueue(DEMO_WORKSPACE_ID);
  const leads = data?.queue ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Follow-up Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Leads sorted by urgency — act on the hottest ones first
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Auto-refreshes every 30s
          </span>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh queue"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : leads.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onExpand={() => {}} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Stats bar */}
      {leads.length > 0 && (
        <div className="mt-6 flex items-center gap-4 text-xs text-slate-500">
          <span>{leads.length} leads in queue</span>
          <span className="w-px h-3 bg-slate-800" />
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {leads.filter((l) => l.urgency_score && l.urgency_score >= 9).length} critical
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            {leads.filter((l) => l.urgency_score && l.urgency_score >= 7 && l.urgency_score <= 8).length} high
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {leads.filter((l) => l.urgency_score && l.urgency_score >= 4 && l.urgency_score <= 6).length} medium
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {leads.filter((l) => l.urgency_score && l.urgency_score <= 3).length} low
          </span>
        </div>
      )}
    </div>
  );
}