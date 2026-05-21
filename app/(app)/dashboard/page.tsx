import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Plus } from "lucide-react";
import { Suspense } from "react";
import type { Estimate } from "@/db/schema";
import DashboardFilters from "./DashboardFilters";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  sent: "secondary",
  accepted: "default",
  declined: "destructive",
};

const STATUS_DOT: Record<string, string> = {
  draft: "bg-gray-300",
  sent: "bg-blue-400",
  accepted: "bg-green-500",
  declined: "bg-red-400",
};

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { status, q } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Build filtered query
  let query = supabase
    .from("estimates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (q) query = query.or(`title.ilike.%${q}%,client_name.ilike.%${q}%`);

  const { data: estimates, error } = await query;

  // Always fetch totals unfiltered for the summary bar
  const { data: allEstimates } = await supabase
    .from("estimates")
    .select("total_cost, status")
    .eq("user_id", user.id);

  const rows = (estimates ?? []) as Estimate[];
  const all = allEstimates ?? [];

  const totalValue = all.reduce((acc, e) => acc + Number(e.total_cost), 0);
  const counts = {
    total: all.length,
    accepted: all.filter((e) => e.status === "accepted").length,
    sent: all.filter((e) => e.status === "sent").length,
    draft: all.filter((e) => e.status === "draft").length,
  };
  const acceptedValue = all.filter((e) => e.status === "accepted").reduce((acc, e) => acc + Number(e.total_cost), 0);

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Estimates", value: counts.total.toString(), sub: `$${totalValue.toLocaleString()} total value` },
          { label: "Accepted", value: counts.accepted.toString(), sub: `$${acceptedValue.toLocaleString()} won`, accent: "text-green-600" },
          { label: "Pending", value: counts.sent.toString(), sub: "awaiting response", accent: "text-blue-600" },
          { label: "Drafts", value: counts.draft.toString(), sub: "not yet sent" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-[6px] px-4 py-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${stat.accent ?? "text-foreground"}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Header + New button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Estimates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {rows.length} {status || q ? "matching" : ""} estimate{rows.length !== 1 ? "s" : ""}
            {status || q ? "" : ` · $${totalValue.toLocaleString()} total`}
          </p>
        </div>
        <Link href="/estimates/new">
          <Button className="rounded-[6px] font-semibold uppercase tracking-wide text-sm gap-1.5">
            <Plus className="w-4 h-4" />
            New Estimate
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Suspense>
        <DashboardFilters />
      </Suspense>

      {error && (
        <div className="p-4 rounded-[6px] bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-6">
          Failed to load estimates: {error.message}
        </div>
      )}

      {!error && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-[6px]">
          <div className="w-16 h-16 rounded-[6px] bg-primary/10 flex items-center justify-center mb-4">
            <Mic className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {status || q ? "No estimates match" : "No estimates yet"}
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            {status || q
              ? "Try a different filter or search term."
              : "Record your first voice walkthrough and let Bid.Fast turn it into a professional estimate."}
          </p>
          {!status && !q && (
            <Link href="/estimates/new">
              <Button className="rounded-[6px] font-semibold uppercase tracking-wide text-sm gap-1.5">
                <Mic className="w-4 h-4" />
                Record First Estimate
              </Button>
            </Link>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-card border border-border rounded-[6px] shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-6 py-3">Estimate</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-6 py-3 hidden md:table-cell">Client</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-6 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-6 py-3">Total</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-6 py-3 hidden sm:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((est) => (
                <tr key={est.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/estimates/${est.id}`} className="font-semibold text-foreground hover:text-primary text-sm transition-colors">
                      {est.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">{est.client_name ?? "—"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[est.status] ?? "bg-gray-300"}`} />
                      <Badge variant={STATUS_VARIANT[est.status] ?? "outline"} className="rounded-[4px] uppercase text-xs tracking-wide font-semibold">
                        {est.status}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      ${Number(est.total_cost).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right hidden sm:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(est.created_at), { addSuffix: true })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
