"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Check, AlertCircle, Loader2, RefreshCw, Trash2, Plus, Send, Activity, Pencil } from "lucide-react";
import type { Clone } from "@/lib/core/types";

type Check = { ok: boolean; detail: string };
type Health = { ok: boolean; live: boolean; checks: Record<string, Check> };
type SyncResult = { status: "synced" | "skipped" | "failed"; summary: string };

const CHECK_LABELS: Record<string, string> = {
  database: "Supabase database",
  ragFlag: "Memory search enabled",
  openai: "OpenAI",
  github: "GitHub",
  jira: "Jira",
  teamsInbound: "Teams → twin (Power Automate)",
  teamsOutbound: "Twin → Teams cards (optional)",
};

const card =
  "rounded-3xl border border-white/80 bg-[#f1f5fa] p-6 shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff]";
const input =
  "w-full rounded-xl border border-[#d8e2ed] bg-[#f8fafc] px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none";
const primaryBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-indigo-700 disabled:opacity-50";
const secondaryBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d8e2ed] bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";

type TwinForm = {
  name: string;
  owner_role: string;
  owner_department: string;
  owner_email: string;
  expertise_tags: string;
  github_username: string;
  jira_jql: string;
};

const EMPTY_FORM: TwinForm = {
  name: "",
  owner_role: "",
  owner_department: "",
  owner_email: "",
  expertise_tags: "",
  github_username: "",
  jira_jql: "",
};

function formFromClone(c: Clone): TwinForm {
  return {
    name: c.name,
    owner_role: c.owner_role ?? "",
    owner_department: c.owner_department ?? "",
    owner_email: c.owner_email ?? "",
    expertise_tags: (c.expertise_tags ?? []).join(", "),
    github_username: c.personality.sources?.github_username ?? "",
    jira_jql: c.personality.sources?.jira_jql ?? "",
  };
}

function TwinFields({ form, onChange }: { form: TwinForm; onChange: (f: TwinForm) => void }) {
  const field = (key: keyof TwinForm, label: string, placeholder: string, wide = false) => (
    <label className={wide ? "col-span-2" : ""}>
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <input
        className={input}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => onChange({ ...form, [key]: e.target.value })}
      />
    </label>
  );
  return (
    <div className="grid grid-cols-2 gap-3">
      {field("name", "Name *", "Syed Ali")}
      {field("owner_email", "Email", "syed.ali@company.com")}
      {field("owner_role", "Role", "Backend Engineer")}
      {field("owner_department", "Team", "Platform")}
      {field("expertise_tags", "Expertise (comma-separated)", "backend, database, api", true)}
      {field("github_username", "GitHub username", "your-github-login")}
      {field("jira_jql", "Jira filter (JQL)", 'assignee = "you@company.com" ORDER BY updated DESC')}
    </div>
  );
}

export default function SettingsPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [checking, setChecking] = useState(false);
  const [twins, setTwins] = useState<Clone[]>([]);
  const [loadingTwins, setLoadingTwins] = useState(true);
  const [newTwin, setNewTwin] = useState<TwinForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<{ id: string; form: TwinForm } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, { github: SyncResult; jira: SyncResult } | string>>({});
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [teamsTest, setTeamsTest] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  const runHealth = useCallback(async (live: boolean) => {
    setChecking(true);
    try {
      const res = await fetch(`/api/health${live ? "?live=1" : ""}`);
      setHealth(await res.json());
    } catch {
      setHealth(null);
    } finally {
      setChecking(false);
    }
  }, []);

  const loadTwins = useCallback(async () => {
    setLoadingTwins(true);
    try {
      const res = await fetch("/api/clones");
      const data = await res.json();
      setTwins(data.clones ?? []);
    } finally {
      setLoadingTwins(false);
    }
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    runHealth(false);
    loadTwins();
  }, [runHealth, loadTwins]);

  const saveTwin = async (form: TwinForm, id?: string) => {
    setMessage(null);
    const res = await fetch(id ? `/api/clones/${id}` : "/api/clones", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ text: data.error || "Could not save twin", ok: false });
      return false;
    }
    setMessage({ text: id ? `Saved ${form.name}.` : `Created ${form.name}'s twin. Click Sync to load their data.`, ok: true });
    await loadTwins();
    runHealth(false);
    return true;
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (await saveTwin(newTwin)) setNewTwin(EMPTY_FORM);
  };

  const handleSync = async (twin: Clone) => {
    setBusyId(twin.id);
    setSyncResults((prev) => ({ ...prev, [twin.id]: "Syncing GitHub and Jira… (can take a minute)" }));
    try {
      const res = await fetch(`/api/clones/${twin.id}/sync`, { method: "POST" });
      const data = await res.json();
      setSyncResults((prev) => ({ ...prev, [twin.id]: data.results ?? data.error ?? "Sync failed" }));
      await loadTwins();
      runHealth(false);
    } catch {
      setSyncResults((prev) => ({ ...prev, [twin.id]: "Sync failed: server not reachable" }));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (twin: Clone) => {
    if (!window.confirm(`Delete ${twin.name}'s twin and all of its synced memory?`)) return;
    setBusyId(twin.id);
    await fetch(`/api/clones/${twin.id}`, { method: "DELETE" });
    setBusyId(null);
    await loadTwins();
    runHealth(false);
  };

  const handleTeamsTest = async () => {
    setTeamsTest("Sending…");
    const res = await fetch("/api/teams/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "TwinOps connected",
        text: `TwinOps can post to this channel. ${twins.length} twin(s) are set up.`,
      }),
    });
    const data = await res.json();
    setTeamsTest(res.ok ? "Card delivered to Teams." : data.error || "Failed to send");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Twins &amp; integrations</h1>
          <p className="text-sm text-slate-500">Create a twin for each real person, then sync their GitHub and Jira work.</p>
        </div>
        <Link href="/" className={secondaryBtn}>
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      {/* Connection status */}
      <section className={card}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-800">
            <Activity size={16} className="text-indigo-600" /> Connection status
          </h2>
          <button className={primaryBtn} onClick={() => runHealth(true)} disabled={checking}>
            {checking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Test live connections
          </button>
        </div>
        {!health && <p className="text-sm text-slate-500">Checking…</p>}
        {health && (
          <ul className="space-y-2">
            {Object.entries(health.checks).map(([key, c]) => (
              <li key={key} className="flex items-start gap-2 text-[13px]">
                {c.ok ? (
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-rose-500" />
                )}
                <span className="font-semibold text-slate-700">{CHECK_LABELS[key] ?? key}:</span>
                <span className="text-slate-600">{c.detail}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11.5px] text-slate-500">
          Keys live in <code>.env.local</code> on the server and are never shown here.
          {health && !health.live && " Click “Test live connections” to verify each key with a real call."}
        </p>
      </section>

      {/* Twins */}
      <section className={card}>
        <h2 className="mb-4 text-[15px] font-bold text-slate-800">Twins</h2>
        {message && (
          <p className={`mb-3 text-[13px] font-semibold ${message.ok ? "text-emerald-700" : "text-rose-600"}`}>{message.text}</p>
        )}
        {loadingTwins ? (
          <Loader2 size={18} className="animate-spin text-indigo-500" />
        ) : twins.length === 0 ? (
          <p className="mb-4 text-sm text-slate-500">No twins yet. Add yourself first, then your teammates.</p>
        ) : (
          <div className="mb-6 space-y-3">
            {twins.map((t) => {
              const result = syncResults[t.id];
              const isEditing = editing?.id === t.id;
              return (
                <div key={t.id} className="rounded-2xl border border-[#e2eaf3] bg-white p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <TwinFields form={editing.form} onChange={(form) => setEditing({ id: t.id, form })} />
                      <div className="flex gap-2">
                        <button
                          className={primaryBtn}
                          onClick={async () => (await saveTwin(editing.form, t.id)) && setEditing(null)}
                        >
                          Save
                        </button>
                        <button className={secondaryBtn} onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-slate-800">{t.name}</p>
                          <p className="text-[12px] text-slate-500">
                            {[t.owner_role, t.owner_department, t.owner_email].filter(Boolean).join(" · ") || "No role set"}
                          </p>
                          <p className="mt-1 text-[12px] text-slate-600">
                            GitHub: <b>{t.personality.sources?.github_username || "not set"}</b> · Jira:{" "}
                            <b>{t.personality.sources?.jira_jql || "not set"}</b>
                          </p>
                          <p className="text-[11.5px] text-slate-400">
                            {t.trained_at ? `Last synced ${new Date(t.trained_at).toLocaleString()}` : "Never synced"}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 gap-2">
                          <button className={primaryBtn} onClick={() => handleSync(t)} disabled={busyId === t.id}>
                            <RefreshCw size={13} className={busyId === t.id ? "animate-spin" : ""} /> Sync
                          </button>
                          <button className={secondaryBtn} onClick={() => setEditing({ id: t.id, form: formFromClone(t) })}>
                            <Pencil size={13} />
                          </button>
                          <button className={secondaryBtn} onClick={() => handleDelete(t)} disabled={busyId === t.id}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {result && (
                        <div className="mt-2 rounded-xl bg-[#f1f5fa] px-3 py-2 text-[12px] text-slate-700">
                          {typeof result === "string" ? (
                            result
                          ) : (
                            <>
                              <p>
                                <b>GitHub</b> ({result.github.status}): {result.github.summary}
                              </p>
                              <p>
                                <b>Jira</b> ({result.jira.status}): {result.jira.summary}
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-dashed border-[#c9d5e3] p-4">
          <p className="text-[13px] font-bold text-slate-700">Add a twin</p>
          <TwinFields form={newTwin} onChange={setNewTwin} />
          <button type="submit" className={primaryBtn} disabled={!newTwin.name.trim()}>
            <Plus size={14} /> Create twin
          </button>
        </form>
      </section>

      {/* Teams */}
      <section className={card}>
        <h2 className="mb-2 text-[15px] font-bold text-slate-800">Microsoft Teams</h2>
        <p className="mb-2 text-[13px] text-slate-600">
          Your Power Automate flow should POST to this endpoint with the <code>x-twinops-secret</code> header
          (setup steps in <code>docs/integrations.md</code>):
        </p>
        <code className="mb-3 block rounded-xl bg-white px-3 py-2 text-[12.5px] text-slate-800">
          {origin ? `${origin}/api/teams/events` : "/api/teams/events"}
        </code>
        <p className="mb-3 text-[12px] text-slate-500">
          Teams can&apos;t reach <code>localhost</code>. Use the public tunnel or deployed URL in the flow instead.
        </p>
        <button className={secondaryBtn} onClick={handleTeamsTest}>
          <Send size={13} /> Send a test card to Teams
        </button>
        {teamsTest && <p className="mt-2 text-[12.5px] text-slate-700">{teamsTest}</p>}
      </section>
    </div>
  );
}
