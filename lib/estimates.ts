import type { SupabaseClient } from "@supabase/supabase-js";
import type { Estimate, EstimateLineItem, MaterialListItem } from "@/db/schema";

export async function listEstimates(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data: data as Estimate[] | null, error };
}

export async function getEstimate(supabase: SupabaseClient, id: number, userId: string) {
  const { data, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return { data: data as Estimate | null, error };
}

export async function createEstimate(
  supabase: SupabaseClient,
  userId: string,
  fields: Partial<Omit<Estimate, "id" | "user_id" | "created_at" | "updated_at">> & { voice_transcript: string; title: string }
) {
  const { data, error } = await supabase
    .from("estimates")
    .insert({ user_id: userId, ...fields })
    .select()
    .single();
  return { data: data as Estimate | null, error };
}

export async function updateEstimate(
  supabase: SupabaseClient,
  id: number,
  userId: string,
  fields: Partial<Omit<Estimate, "id" | "user_id" | "created_at" | "updated_at">>
) {
  const { data, error } = await supabase
    .from("estimates")
    .update(fields)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  return { data: data as Estimate | null, error };
}

export async function replaceLineItems(
  supabase: SupabaseClient,
  estimateId: number,
  items: Omit<EstimateLineItem, "id" | "estimate_id" | "created_at" | "sort_order">[]
) {
  const { error: delError } = await supabase
    .from("estimate_line_items")
    .delete()
    .eq("estimate_id", estimateId);
  if (delError) return { data: null, error: delError };
  if (items.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("estimate_line_items")
    .insert(items.map((item, i) => ({ ...item, estimate_id: estimateId, sort_order: i })))
    .select();
  return { data, error };
}

export async function replaceMaterials(
  supabase: SupabaseClient,
  estimateId: number,
  items: Omit<MaterialListItem, "id" | "estimate_id" | "created_at" | "sort_order" | "exported">[]
) {
  const { error: delError } = await supabase
    .from("material_list_items")
    .delete()
    .eq("estimate_id", estimateId);
  if (delError) return { data: null, error: delError };
  if (items.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("material_list_items")
    .insert(items.map((item, i) => ({ ...item, estimate_id: estimateId, sort_order: i })))
    .select();
  return { data, error };
}
