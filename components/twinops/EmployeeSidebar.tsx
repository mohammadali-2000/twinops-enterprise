"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  MessageSquare,
  Users,
  Settings,
  Zap,
  LogOut,
  Hash,
  RefreshCw,
} from "lucide-react";

export type EmployeeView = "chat" | "slack" | "coworkers" | "knowledge";

interface EmployeeSidebarProps {
  activeView: EmployeeView;
  onViewChange: (view: EmployeeView) => void;
  onDemoMode: () => void;
}

const navItems: { id: EmployeeView; label: string; icon: React.ReactNode }[] = [
  {
    id: "slack",
    label: "Teams & Slack Hub",
    icon: <Hash size={17} />,
  },
  {
    id: "chat",
    label: "My Twin Brain",
    icon: <MessageSquare size={17} />,
  },
  {
    id: "coworkers",
    label: "Pod Teammates",
    icon: <Users size={17} />,
  },
  {
    id: "knowledge",
    label: "Episodic Knowledge",
    icon: <BookOpen size={17} />,
  },
];

export function EmployeeSidebar({
  activeView,
  onViewChange,
  onDemoMode,
}: EmployeeSidebarProps) {
  const [email, setEmail] = useState("");
  const [cloneName, setCloneName] = useState("");

  useEffect(() => {
    setEmail(sessionStorage.getItem("twinops_email") || "");
    setCloneName(sessionStorage.getItem("twinops_clone_name") || "");
  }, []);

  return (
    <aside className="flex h-full w-[250px] flex-col bg-[#eaf0f6] border-r border-[#d4deeb] select-none">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] border border-white/60">
          <Sparkles size={18} className="animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-[16px] font-extrabold tracking-tight text-slate-800">
            TwinOps
          </span>
          <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold">
            Enterprise Pod
          </span>
        </div>
      </div>

      {/* User profile capsule */}
      <div className="mx-3 mb-4 rounded-xl bg-[#f1f5fa] p-2.5 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] border border-white/60">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <p className="text-[12px] font-bold text-slate-700 truncate">
            {cloneName || "Enterprise Architect"}
          </p>
        </div>
        <p className="text-[10px] text-slate-500 pl-4.5 truncate">
          {email || "engineer@enterprise.internal"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1.5">
        <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
          Workflows
        </p>
        {navItems.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all ${
                active
                  ? "bg-[#e5edf6] text-indigo-700 font-bold shadow-[inset_3px_3px_6px_#cfd8e5,inset_-3px_-3px_6px_#ffffff] border border-white/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-[#f1f5fa] hover:shadow-[3px_3px_7px_#cfd8e5,-3px_-3px_7px_#ffffff]"
              }`}
            >
              <span className={active ? "text-indigo-600" : "text-slate-400"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-[#d4deeb] space-y-2">
        <a
          href="/settings"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-600 transition-all hover:bg-[#f1f5fa] hover:shadow-[3px_3px_7px_#cfd8e5,-3px_-3px_7px_#ffffff]"
        >
          <Settings size={16} className="text-slate-400" />
          Settings & Keys
        </a>
        <button
          onClick={onDemoMode}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-2.5 text-[12.5px] font-bold text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] hover:opacity-95 active:scale-[0.98] transition-all"
        >
          <RefreshCw size={14} className="text-white" />
          Sync Real Repositories
        </button>
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-1.5 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
        >
          <LogOut size={12} />
          Switch Portal
        </Link>
      </div>
    </aside>
  );
}
