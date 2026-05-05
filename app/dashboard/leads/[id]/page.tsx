"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  Phone,
  PhoneMissed,
  MessageSquare,
  AlertTriangle,
  Calendar,
  Plus,
  X,
  ChevronDown,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { useLead, useUpdateLeadStatus, type Lead } from "@/lib/hooks/use-leads";
import { useFollowups, useCreateFollowup, useCompleteFollowup, type FollowUp } from "@/lib/hooks/use-followups";
import { DEMO_WORKSPACE_ID, getUrgencyColor, getUrgencyLabel, getSourceBadge, getIntentBadge } from "@/lib/constants";

const STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;
const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};
const STATUS_COLORS: Record<string, string> = {
  new: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  contacted: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  qualified: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  won: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  lost: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-slate-800 text-slate-400 hover:text-teal-400 hover:bg-slate-700 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} className="text-teal-400" /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function FollowUpItem({
  followUp,
  onComplete,
}: {
  followUp: FollowUp;
  onComplete: (id: string, outcome: string) => void;
}) {
  const [showOutcomes, setShowOutcomes] = useState(false);
  const isComplete = !!followUp.completed_at;
  const typeIcons: Record<string, React.ReactNode> = {
    email: <Mail size={14} />,
    call: <Phone size={14} />,
    text: <MessageSquare size={14} />,
  };
  const priorityColors: Record<string, string> = {
    urgent: "text-red-400",
    high: "text-orange-400",
    medium: "text-amber-400",
    low: "text-emerald-400",
  };

  return (
    <div
      className={`p-3 rounded-lg border ${
        isComplete
          ? "bg-slate-900/50 border-slate-800 opacity-60"
          : "bg-slate-900 border-slate-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isComplete ? "bg-emerald-500/20" : "bg-slate-800"
        }`}>
          {isComplete ? (
            <Check size={14} className="text-emerald-400" />
          ) : (
            typeIcons[followUp.type] || <Clock size={14} className="text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-200 capitalize">
              {followUp.type} follow-up
            </span>
            <span className={`text-[10px] font-bold uppercase ${priorityColors[followUp.priority] || "text-slate-500"}`}>
              {followUp.priority}
            </span>
            {isComplete && followUp.outcome && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                {followUp.outcome.replace("_", " ")}
              </span>
            )}
          </div>
          {followUp.notes && (
            <p className="text-xs text-slate-400 mt-1">{followUp.notes}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
            {followUp.due_at && (
              <span className="inline-flex items-center gap-1">
                <Calendar size={10} />
                Due {formatDistanceToNow(new Date(followUp.due_at), { addSuffix: true })}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock size={10} />
              {isComplete
                ? `Completed ${formatDistanceToNow(new Date(followUp.completed_at!), { addSuffix: true })}`
                : `Created ${formatDistanceToNow(new Date(followUp.created_at), { addSuffix: true })}`}
            </span>
          </div>
        </div>
        {!isComplete && (
          <div className="relative">
            <button
              onClick={() => setShowOutcomes(!showOutcomes)}
              className="p-1.5 rounded-md text-xs bg-slate-800 text-slate-400 hover:bg-teal-600/15 hover:text-teal-400 transition-colors"
            >
              Complete
            </button>
            {showOutcomes && (
              <div className="absolute right-0 top-8 z-10 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[140px]">
                {["completed", "skipped", "no_answer", "bad_info"].map((outcome) => (
                  <button
                    key={outcome}
                    onClick={() => {
                      onComplete(followUp.id, outcome);
                      setShowOutcomes(false);
                    }}
                    className="block w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white capitalize transition-colors"
                  >
                    {outcome.replace("_", " ")}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateFollowUpForm({
  leadId,
  onClose,
}: {
  leadId: string;
  onClose: () => void;
}) {
  const createFollowup = useCreateFollowup();
  const [type, setType] = useState("email");
  const [priority, setPriority] = useState("medium");
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFollowup.mutate(
      {
        leadId,
        type,
        priority,
        dueAt: dueAt || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: onClose,
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-200">New Follow-up</h4>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="email">Email</option>
              <option value="call">Call</option>
              <option value="text">Text</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Due Date</label>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-teal-500 resize-none"
            placeholder="What needs to happen..."
          />
        </div>

        <button
          type="submit"
          disabled={createFollowup.isPending}
          className="w-full py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 transition-colors"
        >
          {createFollowup.isPending ? "Creating..." : "Create Follow-up"}
        </button>
      </form>
    </motion.div>
  );
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const { data: leadData, isLoading: leadLoading } = useLead(leadId, DEMO_WORKSPACE_ID);
  const { data: followupsData, isLoading: followupsLoading } = useFollowups(leadId, DEMO_WORKSPACE_ID);
  const updateStatus = useUpdateLeadStatus();
  const completeFollowup = useCompleteFollowup();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [replyCopied, setReplyCopied] = useState(false);

  const lead = leadData?.lead;
  const followups = followupsData?.follow_ups ?? [];

  const handleStatusChange = (status: string) => {
    updateStatus.mutate({ leadId, status });
    setShowStatusDropdown(false);
  };

  const handleCompleteFollowup = (followupId: string, outcome: string) => {
    completeFollowup.mutate({ followupId, outcome });
  };

  const handleCopyReply = () => {
    if (lead?.suggested_reply) {
      navigator.clipboard.writeText(lead.suggested_reply);
      setReplyCopied(true);
      setTimeout(() => setReplyCopied(false), 2000);
    }
  };

  if (leadLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-800 rounded w-48" />
        <div className="h-40 bg-slate-900 rounded-xl border border-slate-800" />
        <div className="h-60 bg-slate-900 rounded-xl border border-slate-800" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle size={32} className="text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-300">Lead not found</h3>
        <Link href="/dashboard" className="mt-4 text-sm text-teal-400 hover:underline">
          ← Back to Queue
        </Link>
      </div>
    );
  }

  const urgency = getUrgencyColor(lead.urgency_score);
  const sourceBadge = getSourceBadge(lead.source);
  const intentBadge = getIntentBadge(lead.intent);

  return (
    <div>
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{lead.name || "Unknown Lead"}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {lead.company && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Building2 size={11} />
                {lead.company}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${sourceBadge.bg} ${sourceBadge.text}`}>
              {sourceBadge.label}
            </span>
            {intentBadge && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${intentBadge.bg} ${intentBadge.text}`}>
                {intentBadge.label}
              </span>
            )}
          </div>
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              STATUS_COLORS[lead.status] || STATUS_COLORS.new
            }`}
          >
            {STATUS_LABELS[lead.status] || lead.status}
            <ChevronDown size={12} />
          </button>
          {showStatusDropdown && (
            <div className="absolute right-0 top-9 z-10 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[140px]">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-slate-700 transition-colors ${
                    lead.status === s ? "text-teal-400 font-medium" : "text-slate-300"
                  }`}
                >
                  {lead.status === s && <Check size={12} />}
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left column: Lead info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5"
          >
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Contact Info</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-slate-300 hover:text-teal-400 transition-colors">
                  <Mail size={14} className="text-slate-500" />
                  {lead.email}
                </a>
              )}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-slate-300 hover:text-teal-400 transition-colors">
                  <Phone size={14} className="text-slate-500" />
                  {lead.phone}
                </a>
              )}
              {lead.company && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Building2 size={14} className="text-slate-500" />
                  {lead.company}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock size={14} className="text-slate-500" />
                Last activity {formatDistanceToNow(new Date(lead.last_activity_at), { addSuffix: true })}
              </div>
            </div>
          </motion.div>

          {/* AI Summary */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5"
          >
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">AI Summary</h3>
            {lead.summary ? (
              <p className="text-sm text-slate-300 leading-relaxed">{lead.summary}</p>
            ) : (
              <p className="text-sm text-slate-500 italic">No summary available</p>
            )}
          </motion.div>

          {/* Suggested reply */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 border border-teal-500/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wide">Suggested Reply</h3>
              {lead.suggested_reply && (
                <CopyButton text={lead.suggested_reply} />
              )}
            </div>
            {lead.suggested_reply ? (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{lead.suggested_reply}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No suggested reply available</p>
            )}
            {lead.urgency_reason && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <p className="text-[11px] text-slate-500 mb-1 uppercase tracking-wide font-medium">Urgency reason</p>
                <p className="text-xs text-slate-400">{lead.urgency_reason}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right column: Urgency + Follow-ups */}
        <div className="space-y-4">
          {/* Urgency card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`bg-slate-900 border rounded-xl p-5 ${urgency.border}`}
          >
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Urgency Score</h3>
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold ${urgency.bg} ${urgency.text} ${urgency.glow}`}>
                {lead.urgency_score ?? "—"}
              </div>
              <div>
                <p className={`text-sm font-semibold ${urgency.text}`}>{getUrgencyLabel(lead.urgency_score)}</p>
                {lead.urgency_reason && (
                  <p className="text-xs text-slate-500 mt-0.5">{lead.urgency_reason}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Follow-ups */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Follow-ups ({followups.length})
              </h3>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-teal-600/15 text-teal-400 hover:bg-teal-600/25 transition-colors"
              >
                <Plus size={12} />
                New
              </button>
            </div>

            {showCreateForm && (
              <CreateFollowUpForm leadId={leadId} onClose={() => setShowCreateForm(false)} />
            )}

            <div className="space-y-2 mt-3">
              {followupsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : followups.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No follow-ups yet
                </p>
              ) : (
                followups.map((fu) => (
                  <FollowUpItem
                    key={fu.id}
                    followUp={fu}
                    onComplete={handleCompleteFollowup}
                  />
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}