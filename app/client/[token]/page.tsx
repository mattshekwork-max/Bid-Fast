import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import ClientEstimateView from "./ClientEstimateView";

type Params = Promise<{ token: string }>;

export default async function ClientEstimatePage({ params }: { params: Params }) {
  const { token } = await params;

  const admin = getSupabaseAdmin();

  const { data: estimate, error } = await admin
    .from("estimates")
    .select("*")
    .eq("client_token", token)
    .single();

  if (error || !estimate) notFound();

  const { data: lineItems } = await admin
    .from("estimate_line_items")
    .select("*")
    .eq("estimate_id", estimate.id)
    .order("sort_order");

  const { data: materials } = await admin
    .from("material_list_items")
    .select("*")
    .eq("estimate_id", estimate.id)
    .order("sort_order");

  return (
    <ClientEstimateView
      estimate={estimate}
      lineItems={lineItems ?? []}
      materials={materials ?? []}
    />
  );
}
