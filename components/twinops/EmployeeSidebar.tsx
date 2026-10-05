"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Sparkles, MessageSquare, Users, Settings, LogOut, RefreshCw } from "lucide-react";

export type EmployeeView = "chat" | "coworkers" | "knowledge";

interface EmployeeSidebarProps {
  activeView: EmployeeView;
  onViewChange: (view: EmployeeView) => void;
}

const navItems: { id: EmployeeView; label: string; icon: React.ReactNode }[] = [
  { id: "chat", label: "My Twin", icon: <MessageSquare size={17} /> },
  { id: "coworkers", label: "Teammates' Twins", icon: <Users size={17} /> },
  { id: "knowledge", label: "Knowledge", icon: <BookOpen size={17} /> },
];

type SyncResult = { status: "synced" | "skipped" | "failed"; summary: string };

export function EmployeeSidebar({ activeView, onViewChange }: EmployeeSidebarProps) {
  const [cloneId, setCloneId] = useState("");
  const [cloneName, setCloneName] = useState("");
  const [cloneRole, setCloneRole] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    setCloneId(sessionStorage.getItem("twinops_clone_id") || "");
    setCloneName(sessionStorage.getItem("twinops_clone_name") || "");
    setCloneRole(sessionStorage.getItem("twinops_clone_role") || "");
  }, []);

  const handleSync = async () => {
    if (!cloneId) return;
    setSyncing(true);
    setSyncMessage("Syncing GitHub and Jira…");
    try {
      const res = await fetch(`/api/clones/${cloneId}/sync`, { method: "POST" });
      const data = await res.json();
      if (!data.results) throw new Error(data.error || "Sync failed");
      const r = data.results as { github: SyncResult; jira: SyncResult };
      setSyncMessage(`GitHub: ${r.github.summary}\nJira: ${r.jira.summary}`);
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <aside className="flex h-full w-[250px] flex-col bg-[#eaf0f6] border-r border-[#d4deeb] select-none">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] border border-white/60">
          <Sparkles size={18} />
        </div>
        <div className="flex flex-col">
          <span className="text-[16px] font-extrabold tracking-tight text-slate-800">TwinOps</span>
          <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold">Employee view</span>
        </div>
      </div>

      <div className="mx-3 mb-4 rounded-xl bg-[#f1f5fa] p-2.5 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] border border-white/60">
        {cloneName ? (
          <>
            <p className="text-[12px] font-bold text-slate-700 truncate">{cloneName}</p>
            <p className="text-[10px] text-slate-500 truncate">{cloneRole}</p>
          </>
        ) : (
          <Link href="/" className="text-[12px] font-bold text-indigo-600 underline">
            Choose a twin
          </Link>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1.5">
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
              <span className={active ? "text-indigo-600" : "text-slate-400"}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#d4deeb] space-y-2">
        {syncMessage && (
          <p className="whitespace-pre-line rounded-lg bg-[#f1f5fa] px-2.5 py-2 text-[10.5px] text-slate-600">
            {syncMessage}
          </p>
        )}
        <button
          onClick={handleSync}
          disabled={!cloneId || syncing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-2.5 text-[12.5px] font-bold text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          Sync my GitHub &amp; Jira
        </button>
        <Link
          href="/settings"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-600 transition-all hover:bg-[#f1f5fa]"
        >
          <Settings size={16} className="text-slate-400" />
          Twins &amp; integrations
        </Link>
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-1.5 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-600"
        >
          <LogOut size={12} />
          Switch twin
        </Link>
      </div>
    </aside>
  );
}
