"use client";

import { motion } from "framer-motion";
import { Users, Filter } from "lucide-react";
import { useLeads } from "@/lib/hooks/use-leads";
import { DEMO_WORKSPACE_ID, getUrgencyColor, getSourceBadge } from "@/lib/constants";
import Link from "next/link";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useLeads(DEMO_WORKSPACE_ID, {
    status: statusFilter || undefined,
  });
  const leads = data?.leads ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">All leads across your workspace</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter size={14} className="text-slate-500" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-teal-600/20 text-teal-400 border border-teal-500/30"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-40" />
                  <div className="h-2.5 bg-slate-800 rounded w-60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <Users size={32} className="text-slate-700 mb-4" />
          <p className="text-slate-500 text-sm">No leads found</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {leads.map((lead) => {
            const sourceBadge = getSourceBadge(lead.source);
            const urgency = getUrgencyColor(lead.urgency_score);
            return (
              <Link
                key={lead.id}
                href={`/dashboard/leads/${lead.id}`}
                className="block bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                    {lead.name ? lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {lead.name || "Unknown Lead"}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sourceBadge.bg} ${sourceBadge.text}`}>
                        {sourceBadge.label}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${urgency.bg} ${urgency.text}`}>
                        {lead.urgency_score ?? "—"}
                      </span>
                    </div>
                    {lead.company && (
                      <p className="text-xs text-slate-500 mt-0.5">{lead.company}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">
                    {formatDistanceToNow(new Date(lead.last_activity_at), { addSuffix: true })}
                  </span>
                </div>
              </Link>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}