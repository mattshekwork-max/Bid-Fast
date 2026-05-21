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

  const [{ data: lineItems }, { data: materials }, { data: contractor }] = await Promise.all([
    admin.from("estimate_line_items").select("*").eq("estimate_id", estimate.id).order("sort_order"),
    admin.from("material_list_items").select("*").eq("estimate_id", estimate.id).order("sort_order"),
    admin.from("users").select("company_name,company_phone,company_address,company_logo_url,company_website,company_license").eq("id", estimate.user_id).single(),
  ]);

  return (
    <ClientEstimateView
      estimate={estimate}
      lineItems={lineItems ?? []}
      materials={materials ?? []}
      contractor={contractor ?? {}}
    />
  );
}
