"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";

const STATUSES = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

export default function DashboardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const status = searchParams.get("status") ?? "";
  const q = searchParams.get("q") ?? "";

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      startTransition(() => router.replace(`${pathname}?${params.toString()}`));
    },
    [router, pathname, searchParams]
  );

  return (
    <div className={`flex flex-col sm:flex-row gap-3 mb-6 transition-opacity ${isPending ? "opacity-60" : ""}`}>
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Search estimates…"
          defaultValue={q}
          onChange={(e) => update("q", e.target.value)}
          className="w-full pl-9 pr-3 h-9 rounded-[6px] border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-[6px] p-1 border border-border">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => update("status", s.value)}
            className={`px-3 h-7 rounded-[4px] text-xs font-medium transition-colors ${
              status === s.value
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
