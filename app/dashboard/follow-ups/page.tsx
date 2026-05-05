"use client";

import { Clock } from "lucide-react";

export default function FollowUpsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Follow-ups</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your scheduled follow-ups</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
          <Clock size={28} className="text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Follow-ups coming soon</h3>
        <p className="text-sm text-slate-500 max-w-md">
          This page will show all your pending follow-ups across leads. For now, manage follow-ups from each lead&apos;s detail page.
        </p>
      </div>
    </div>
  );
}