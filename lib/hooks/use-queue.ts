"use client";

import { useQuery } from "@tanstack/react-query";
import { DEMO_WORKSPACE_ID } from "@/lib/constants";

export interface QueueLead {
  id: string;
  workspace_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  urgency_score: number | null;
  urgency_reason: string | null;
  intent: string | null;
  language: string;
  summary: string | null;
  subject_line: string | null;
  suggested_reply: string | null;
  last_activity_at: string;
  created_at: string;
  pending_follow_ups: number;
}

export function useQueue(workspaceId: string = DEMO_WORKSPACE_ID) {
  return useQuery<{ queue: QueueLead[] }>({
    queryKey: ["queue", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/queue?workspace_id=${workspaceId}`);
      if (!res.ok) throw new Error("Failed to fetch queue");
      return res.json();
    },
    refetchInterval: 30_000, // auto-refresh every 30s
  });
}