"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, UserCheck, LineChart, Settings } from "lucide-react";
import type { CloneProfile } from "@/lib/twinops/types";

export default function LandingPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<CloneProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/twinops/clones")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load twins");
        setProfiles(data.profiles ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load twins"))
      .finally(() => setLoading(false));
  }, []);

  const openTwin = (p: CloneProfile) => {
    sessionStorage.setItem("twinops_clone_id", p.employee.id);
    sessionStorage.setItem("twinops_clone_name", p.employee.name);
    sessionStorage.setItem("twinops_clone_role", p.employee.role);
    router.push("/employee");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eaf0f6] p-4 select-none">
      <div className="w-full max-w-[480px]">
        <div className="rounded-3xl bg-[#f1f5fa] p-7 sm:p-9 shadow-[10px_10px_25px_#cfd8e5,-10px_-10px_25px_#ffffff] border border-white/90">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] border border-white/60">
              <Sparkles size={24} />
            </div>
          </div>

          <h1 className="mb-1 text-center text-[23px] font-extrabold text-slate-800 tracking-tight">
            TwinOps Enterprise
          </h1>
          <p className="mb-6 text-center text-[12.5px] text-slate-500 font-medium">
            AI digital twins grounded in your team&apos;s real GitHub and Jira work
          </p>

          <div className="mb-5 rounded-2xl bg-[#e6edf5] p-3.5 shadow-[inset_2px_2px_5px_#cfd8e5,inset_-2px_-2px_5px_#ffffff] border border-white/60">
            <div className="mb-2.5 flex items-center px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <UserCheck size={14} className="text-indigo-600" />
                Choose your twin
              </span>
            </div>

            {loading && (
              <div className="flex justify-center py-6">
                <Loader2 size={20} className="animate-spin text-indigo-500" />
              </div>
            )}

            {!loading && error && (
              <p className="px-1 py-3 text-[12px] font-semibold text-rose-600">{error}</p>
            )}

            {!loading && !error && profiles.length === 0 && (
              <p className="px-1 py-3 text-[12px] text-slate-600">
                No twins yet.{" "}
                <Link href="/settings" className="font-bold text-indigo-600 underline">
                  Create your first twin in Settings
                </Link>
                .
              </p>
            )}

            {profiles.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {profiles.map((p) => (
                  <button
                    key={p.employee.id}
                    type="button"
                    onClick={() => openTwin(p)}
                    className="flex items-center gap-2.5 rounded-xl bg-[#f1f5fa] p-2.5 text-left shadow-[3px_3px_7px_#cfd8e5,-3px_-3px_7px_#ffffff] border border-white/80 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 text-[10px] font-black text-white shadow-sm">
                      {p.employee.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11.5px] font-bold text-slate-800">{p.employee.name}</div>
                      <div className="truncate text-[9.5px] text-slate-500 font-medium">
                        {p.employee.role}
                        {p.trainedAt ? "" : " · not synced"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/ceo"
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-2.5 text-[12.5px] font-bold text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] hover:opacity-95"
            >
              <LineChart size={15} />
              Leadership view
            </Link>
            <Link
              href="/settings"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#f1f5fa] py-2.5 text-[12.5px] font-bold text-slate-700 shadow-[3px_3px_7px_#cfd8e5,-3px_-3px_7px_#ffffff] border border-white/80 hover:bg-[#eaf0f6]"
            >
              <Settings size={15} />
              Twins &amp; integrations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
