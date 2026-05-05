"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutList,
  Users,
  Clock,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { DEMO_WORKSPACE_ID } from "@/lib/constants";
import { useQueue } from "@/lib/hooks/use-queue";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Queue", icon: LayoutList },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/follow-ups", label: "Follow-ups", icon: Clock },
];

function QueueCount() {
  const { data } = useQueue(DEMO_WORKSPACE_ID);
  const count = data?.queue?.length ?? 0;
  if (count === 0) return null;
  return (
    <span className="ml-auto text-[10px] font-bold bg-teal-600 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
      {count}
    </span>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold font-mono">CF</span>
            </div>
            <span className="font-bold text-lg text-white">CatchFlow</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-teal-600/15 text-teal-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.href === "/dashboard" && <QueueCount />}
                {active && (
                  <ChevronRight size={14} className="ml-auto text-teal-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User placeholder */}
        <div className="px-3 pb-4 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <User size={14} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-300 truncate">Demo User</p>
              <p className="text-[11px] text-slate-500 truncate">demo@catchflow.app</p>
            </div>
            <Settings size={14} className="text-slate-500" />
          </div>
          <button className="flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors w-full">
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center gap-4 px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm">CatchFlow</span>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}