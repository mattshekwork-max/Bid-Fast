import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EstimateEditView from "./EstimateEditView";

type Params = Promise<{ id: string }>;

export default async function EstimatePage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: estimate, error: estError } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (estError || !estimate) notFound();

  const [{ data: lineItems }, { data: materials }] = await Promise.all([
    supabase.from("estimate_line_items").select("*").eq("estimate_id", id).order("sort_order"),
    supabase.from("material_list_items").select("*").eq("estimate_id", id).order("sort_order"),
  ]);

  return (
    <EstimateEditView
      estimate={estimate}
      lineItems={lineItems ?? []}
      materials={materials ?? []}
    />
  );
}
