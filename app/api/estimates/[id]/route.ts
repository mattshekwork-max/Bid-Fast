import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

type Params = Promise<{ id: string }>;

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    title?: string;
    client_name?: string | null;
    client_email?: string | null;
    parsed_description?: string | null;
    line_items?: { description: string; quantity: number; unit: string; unit_cost: number; total_cost: number }[];
    materials?: { material_name: string; quantity: number; unit: string; unit_price: number; total_price: number; supplier_note?: string | null }[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Verify ownership
  const { data: existing, error: fetchError } = await admin
    .from("estimates")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  // Recalculate totals from submitted items
  const lineItems = body.line_items ?? [];
  const materials = body.materials ?? [];

  const total_labor_cost = lineItems.reduce((sum, li) => sum + (li.total_cost ?? 0), 0);
  const total_material_cost = materials.reduce((sum, m) => sum + (m.total_price ?? 0), 0);
  const total_cost = total_labor_cost + total_material_cost;

  // Update estimate header
  const { error: updateError } = await admin
    .from("estimates")
    .update({
      title: body.title,
      client_name: body.client_name ?? null,
      client_email: body.client_email ?? null,
      parsed_description: body.parsed_description ?? null,
      total_labor_cost,
      total_material_cost,
      total_cost,
    })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Replace line items
  await admin.from("estimate_line_items").delete().eq("estimate_id", id);
  if (lineItems.length > 0) {
    const { error: liError } = await admin.from("estimate_line_items").insert(
      lineItems.map((li, i) => ({
        estimate_id: Number(id),
        description: li.description,
        quantity: li.quantity,
        unit: li.unit,
        unit_cost: li.unit_cost,
        total_cost: li.total_cost,
        sort_order: i,
      }))
    );
    if (liError) return NextResponse.json({ error: liError.message }, { status: 500 });
  }

  // Replace materials
  await admin.from("material_list_items").delete().eq("estimate_id", id);
  if (materials.length > 0) {
    const { error: matError } = await admin.from("material_list_items").insert(
      materials.map((m, i) => ({
        estimate_id: Number(id),
        material_name: m.material_name,
        quantity: m.quantity,
        unit: m.unit,
        unit_price: m.unit_price,
        total_price: m.total_price,
        supplier_note: m.supplier_note ?? null,
        sort_order: i,
      }))
    );
    if (matError) return NextResponse.json({ error: matError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, total_labor_cost, total_material_cost, total_cost });
}
