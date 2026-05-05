"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DEMO_WORKSPACE_ID } from "@/lib/constants";

export interface Lead {
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
}

export interface LeadsFilters {
  status?: string;
  source?: string;
  limit?: number;
  offset?: number;
}

export function useLeads(
  workspaceId: string = DEMO_WORKSPACE_ID,
  filters?: LeadsFilters
) {
  const params = new URLSearchParams({ workspace_id: workspaceId });
  if (filters?.status) params.set("status", filters.status);
  if (filters?.source) params.set("source", filters.source);
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));

  return useQuery<{ leads: Lead[] }>({
    queryKey: ["leads", workspaceId, filters],
    queryFn: async () => {
      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
  });
}

export function useLead(leadId: string, workspaceId: string = DEMO_WORKSPACE_ID) {
  return useQuery<{ lead: Lead }>({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}?workspace_id=${workspaceId}`);
      if (!res.ok) throw new Error("Failed to fetch lead");
      return res.json();
    },
    enabled: !!leadId,
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      status,
      workspaceId = DEMO_WORKSPACE_ID,
    }: {
      leadId: string;
      status: string;
      workspaceId?: string;
    }) => {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, workspace_id: workspaceId }),
      });
      if (!res.ok) throw new Error("Failed to update lead status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead"] });
    },
  });
}