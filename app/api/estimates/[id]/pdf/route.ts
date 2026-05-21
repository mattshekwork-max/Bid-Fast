import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

// PDF generation: returns a print-ready HTML page.
// The browser's Print → Save as PDF handles the actual file generation.

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { data: estimate, error: estError } = await admin
    .from("estimates")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (estError || !estimate) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: lineItems } = await admin
    .from("estimate_line_items")
    .select("*")
    .eq("estimate_id", id)
    .order("sort_order");

  const { data: materials } = await admin
    .from("material_list_items")
    .select("*")
    .eq("estimate_id", id)
    .order("sort_order");

  const grandTotal = Number(estimate.total_cost);
  const dateStr = new Date(estimate.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const lineItemRows = (lineItems ?? [])
    .map(
      (item) =>
        `<tr><td>${item.description}</td><td class="num">${Number(item.quantity)}</td><td>${item.unit}</td><td class="num">$${Number(item.unit_cost).toLocaleString()}</td><td class="num bold">$${Number(item.total_cost).toLocaleString()}</td></tr>`
    )
    .join("");

  const materialRows = (materials ?? [])
    .map(
      (item) =>
        `<tr><td>${item.material_name}${item.supplier_note ? ` <span class="supplier">(${item.supplier_note})</span>` : ""}</td><td class="num">${Number(item.quantity)}</td><td>${item.unit}</td><td class="num">$${Number(item.unit_price).toLocaleString()}</td><td class="num bold">$${Number(item.total_price).toLocaleString()}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${estimate.title} — Bid.Fast</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #111; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #065f46; }
  .brand { font-size: 20px; font-weight: 800; color: #065f46; letter-spacing: -0.5px; }
  .brand span { color: #E05A1A; }
  .meta { text-align: right; color: #6B7280; font-size: 11px; }
  .title { font-size: 18px; font-weight: 700; color: #065f46; margin-bottom: 4px; }
  .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; background: #F3F4F6; color: #6B7280; }
  section { margin-bottom: 24px; }
  h2 { font-size: 13px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; padding: 6px 8px; border-bottom: 1px solid #E5E7EB; }
  td { padding: 8px; border-bottom: 1px solid #F3F4F6; font-size: 11px; vertical-align: top; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .bold { font-weight: 600; }
  .supplier { color: #9CA3AF; font-size: 10px; }
  tfoot td { font-weight: 600; color: #374151; border-bottom: none; border-top: 1px solid #E5E7EB; padding-top: 10px; }
  .total-box { background: #065f46; color: white; padding: 16px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
  .total-box .label { font-size: 13px; font-weight: 600; }
  .total-box .amount { font-size: 24px; font-weight: 800; }
  .notes { background: #F9FAFB; padding: 12px 16px; border-radius: 6px; font-size: 11px; color: #6B7280; line-height: 1.6; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #9CA3AF; text-align: center; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="brand">Bid<span>.</span>Fast</div>
    <div class="title" style="margin-top:12px">${estimate.title}</div>
    <span class="status">${estimate.status}</span>
  </div>
  <div class="meta">
    <p>Date: ${dateStr}</p>
    ${estimate.client_name ? `<p style="margin-top:4px">Client: ${estimate.client_name}</p>` : ""}
    ${estimate.client_email ? `<p>${estimate.client_email}</p>` : ""}
  </div>
</div>

${
  lineItems && lineItems.length > 0
    ? `<section>
  <h2>Labor &amp; Work</h2>
  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th class="num">Unit $</th><th class="num">Total</th></tr></thead>
    <tbody>${lineItemRows}</tbody>
    <tfoot><tr><td colspan="4" style="text-align:right">Labor Subtotal</td><td class="num bold">$${Number(estimate.total_labor_cost).toLocaleString()}</td></tr></tfoot>
  </table>
</section>`
    : ""
}

${
  materials && materials.length > 0
    ? `<section>
  <h2>Materials</h2>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th class="num">Unit Cost</th><th class="num">Total</th></tr></thead>
    <tbody>${materialRows}</tbody>
    <tfoot><tr><td colspan="4" style="text-align:right">Material Subtotal</td><td class="num bold">$${Number(estimate.total_material_cost).toLocaleString()}</td></tr></tfoot>
  </table>
</section>`
    : ""
}

<div class="total-box">
  <span class="label">Grand Total</span>
  <span class="amount">$${grandTotal.toLocaleString()}</span>
</div>

${estimate.parsed_description ? `<section style="margin-top:24px"><h2>Notes</h2><div class="notes">${estimate.parsed_description}</div></section>` : ""}

<div class="footer">Generated by Bid.Fast · bid.fast · Built with HelioStack Technologies</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
