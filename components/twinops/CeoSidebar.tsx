"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Sparkles,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";

export type CeoView = "insights" | "clones" | "knowledge";

interface CeoSidebarProps {
  activeView: CeoView;
  onViewChange: (view: CeoView) => void;
}

const navItems: { id: CeoView; label: string; icon: React.ReactNode }[] = [
  {
    id: "insights",
    label: "Multi-Twin Polling",
    icon: <BarChart3 size={17} />,
  },
  {
    id: "clones",
    label: "Delivery Lead Twins",
    icon: <Users size={17} />,
  },
  {
    id: "knowledge",
    label: "Pod Knowledge Graph",
    icon: <BookOpen size={17} />,
  },
];

export function CeoSidebar({ activeView, onViewChange }: CeoSidebarProps) {
  return (
    <aside className="flex h-full w-[250px] flex-col bg-[#eaf0f6] border-r border-[#d4deeb] select-none">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] border border-white/60">
          <Sparkles size={18} className="animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-[16px] font-extrabold tracking-tight text-slate-800">
            TwinOps
          </span>
          <span className="text-[10px] uppercase tracking-wider text-amber-600 font-bold">
            Executive Cockpit
          </span>
        </div>
      </div>

      {/* Role Capsule */}
      <div className="mx-3 mb-4 rounded-xl bg-[#f1f5fa] p-2.5 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] border border-white/60">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-bold text-slate-800">
            Leadership view
          </p>
        </div>
        <p className="text-[10px] text-slate-500">
          Ask all twins at once
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1.5">
        <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
          Strategic Views
        </p>
        {navItems.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all ${
                active
                  ? "bg-[#e5edf6] text-amber-800 font-bold shadow-[inset_3px_3px_6px_#cfd8e5,inset_-3px_-3px_6px_#ffffff] border border-white/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-[#f1f5fa] hover:shadow-[3px_3px_7px_#cfd8e5,-3px_-3px_7px_#ffffff]"
              }`}
            >
              <span className={active ? "text-amber-600" : "text-slate-400"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-[#d4deeb] space-y-2">
        <Link
          href="/settings"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-600 transition-all hover:bg-[#f1f5fa] hover:shadow-[3px_3px_7px_#cfd8e5,-3px_-3px_7px_#ffffff]"
        >
          <Settings size={16} className="text-slate-400" />
          Twins &amp; integrations
        </Link>
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-1.5 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
        >
          <LogOut size={12} />
          Switch view
        </Link>
      </div>
    </aside>
  );
}
