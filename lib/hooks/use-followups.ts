"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DEMO_WORKSPACE_ID } from "@/lib/constants";

export interface FollowUp {
  id: string;
  lead_id: string;
  workspace_id: string;
  type: string;
  priority: string;
  due_at: string | null;
  completed_at: string | null;
  notes: string | null;
  outcome: string | null;
  created_at: string;
}

export function useFollowups(leadId: string, workspaceId: string = DEMO_WORKSPACE_ID) {
  return useQuery<{ follow_ups: FollowUp[] }>({
    queryKey: ["followups", leadId],
    queryFn: async () => {
      const res = await fetch(`/api/followups?lead_id=${leadId}&workspace_id=${workspaceId}`);
      if (!res.ok) throw new Error("Failed to fetch follow-ups");
      return res.json();
    },
    enabled: !!leadId,
  });
}

export function useCreateFollowup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      type,
      priority,
      dueAt,
      notes,
      workspaceId = DEMO_WORKSPACE_ID,
    }: {
      leadId: string;
      type: string;
      priority: string;
      dueAt?: string;
      notes?: string;
      workspaceId?: string;
    }) => {
      const res = await fetch(`/api/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          workspace_id: workspaceId,
          type,
          priority,
          due_at: dueAt || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create follow-up");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["followups", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}

export function useCompleteFollowup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      followupId,
      outcome,
      workspaceId = DEMO_WORKSPACE_ID,
    }: {
      followupId: string;
      outcome: string;
      workspaceId?: string;
    }) => {
      const res = await fetch(`/api/followups/${followupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, workspace_id: workspaceId }),
      });
      if (!res.ok) throw new Error("Failed to complete follow-up");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups"] });
      queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}