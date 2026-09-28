"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  LogIn,
  LogOut,
  Mail,
  HardDrive,
  Sparkles,
  ExternalLink,
  Check,
  AlertCircle,
  Github,
  MessageSquare,
  FileText,
  Send,
  Users,
} from "lucide-react";

type Provider = "teams" | "github" | "jira" | "slack" | "notion" | "google_drive" | "email";

const SYNCABLE_PROVIDERS: Provider[] = ["github", "notion", "google_drive", "jira", "slack"];

const syncRoutes: Partial<Record<Provider, string>> = {
  slack: "/api/slack/sync",
  github: "/api/github/sync",
  notion: "/api/notion/sync",
  google_drive: "/api/google-drive/sync",
  jira: "/api/jira/sync",
  email: "/api/gmail/sync",
};

interface ProviderField {
  key: string;
  label: string;
  type?: "text" | "password";
  placeholder?: string;
}

interface IntegrationStatus {
  provider: Provider;
  updated_at: string;
  has_config: boolean;
  config_preview: Record<string, unknown>;
}

interface SyncFeedback {
  success: boolean;
  message: string;
}

const providerMeta: Record<
  Provider,
  { label: string; description: string; icon: React.ReactNode }
> = {
  teams: {
    label: "Microsoft Teams (Personal & Work)",
    description: "Connect your personal Microsoft account (Outlook / Gmail) or Workflows webhook for ambient twin answering.",
    icon: <Users size={18} className="text-[#505ac9]" />,
  },
  github: {
    label: "GitHub Repositories",
    description: "Sync repositories, commits, PRs, and commit diffs for live code grounding.",
    icon: <Github size={18} className="text-slate-800" />,
  },
  jira: {
    label: "Jira Sprint Board",
    description: "Sync agile sprints, epics, bug tracking, and release boards.",
    icon: <ExternalLink size={18} className="text-blue-600" />,
  },
  slack: {
    label: "Slack Workspace",
    description: "Sync delivery channels and messages into organizational memory.",
    icon: <MessageSquare size={18} className="text-emerald-600" />,
  },
  notion: {
    label: "Notion & Confluence",
    description: "Sync engineering workspace pages and design documents.",
    icon: <FileText size={18} className="text-amber-600" />,
  },
  google_drive: {
    label: "Google Workspace & M365",
    description: "Sync cloud architecture specs and shared presentations.",
    icon: null,
  },
  email: {
    label: "Corporate Mail (IMAP / Exchange)",
    description: "Sync relevant architecture threads into private twin context.",
    icon: <Mail size={18} className="text-rose-600" />,
  },
};

const providerFields: Record<Provider, ProviderField[]> = {
  teams: [
    { key: "email", label: "Corporate / Microsoft Email", placeholder: "engineer@company.com (or Outlook/Teams)" },
    { key: "channel", label: "Teams Channel / Chat Name", placeholder: "general or platform-delivery" },
    { key: "webhook_url", label: "Teams Workflows Webhook URL (Power Automate)", type: "password", placeholder: "https://prod-XX.westus.logic.azure.com/workflows/..." },
  ],
  github: [
    { key: "username", label: "GitHub Username / Organization", placeholder: "enterprise-org" },
    { key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_..." },
  ],
  jira: [
    { key: "base_url", label: "Base URL", placeholder: "https://your-domain.atlassian.net" },
    { key: "email", label: "Account Email", placeholder: "you@example.com" },
    { key: "api_token", label: "API Token", type: "password" },
  ],
  slack: [
    { key: "bot_token", label: "Bot / Webhook Token", type: "password", placeholder: "xoxb-... or webhook URL" },
  ],
  notion: [
    { key: "api_key", label: "API Key", type: "password", placeholder: "ntn_..." },
  ],
  google_drive: [],
  email: [
    { key: "address", label: "Email Address", placeholder: "you@example.com" },
    { key: "app_password", label: "App Password", type: "password" },
  ],
};

const NON_GOOGLE_PROVIDERS: Provider[] = ["teams", "github", "jira", "slack", "notion", "email"];

function formatSyncResult(result: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof result.channels_scanned === "number") parts.push(`${result.channels_scanned} channels`);
  if (typeof result.messages_fetched === "number") parts.push(`${result.messages_fetched} messages`);
  if (typeof result.repositories_scanned === "number") parts.push(`${result.repositories_scanned} repos`);
  if (typeof result.pages_scanned === "number") parts.push(`${result.pages_scanned} pages`);
  if (typeof result.files_scanned === "number") parts.push(`${result.files_scanned} files`);
  if (typeof result.documents_created === "number") parts.push(`${result.documents_created} docs`);
  if (typeof result.chunks_created === "number") parts.push(`${result.chunks_created} chunks`);
  return parts.length > 0 ? parts.join(", ") : "Sync complete";
}

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="flex-shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<Record<Provider, Record<string, string>>>({
    teams: {}, github: {}, jira: {}, slack: {}, notion: {}, google_drive: {}, email: {},
  });
  const [statuses, setStatuses] = useState<Record<Provider, IntegrationStatus | null>>({
    teams: null, github: null, jira: null, slack: null, notion: null, google_drive: null, email: null,
  });
  const [savingProvider, setSavingProvider] = useState<Provider | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<Provider | null>(null);
  const [testingTeams, setTestingTeams] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<Record<string, SyncFeedback>>({});
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const isGoogleOAuth = useMemo(() => {
    const s = statuses.google_drive;
    return s?.has_config === true && s?.config_preview?.auth_type === "oauth";
  }, [statuses.google_drive]);

  const googleEmail = useMemo(() => {
    const s = statuses.google_drive;
    return typeof s?.config_preview?.email === "string" ? s.config_preview.email : null;
  }, [statuses.google_drive]);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();
        const map: Record<Provider, IntegrationStatus | null> = {
          teams: null, github: null, jira: null, slack: null, notion: null, google_drive: null, email: null,
        };
        const initialForm: Record<Provider, Record<string, string>> = {
          teams: {}, github: {}, jira: {}, slack: {}, notion: {}, google_drive: {}, email: {},
        };
        for (const item of data.integrations as IntegrationStatus[]) {
          map[item.provider] = item;
          if (item.config_preview) {
            const preview = item.config_preview as Record<string, string>;
            for (const [k, v] of Object.entries(preview)) {
              if (v && typeof v === "string" && !v.includes("***")) {
                initialForm[item.provider][k] = v;
              }
            }
          }
        }
        setStatuses(map);
        setFormState((prev) => ({
          ...initialForm,
          ...prev,
        }));
      }
    } catch {
      // ignore error
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "google_connected") {
      setMessage({ text: "Google account connected successfully.", type: "success" });
    } else if (error) {
      setMessage({ text: `OAuth error: ${error}`, type: "error" });
    }
  }, [searchParams]);

  const handleInputChange = (provider: Provider, key: string, val: string) => {
    setFormState((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], [key]: val },
    }));
  };

  const handleSave = async (provider: Provider) => {
    setSavingProvider(provider);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, config: formState[provider] }),
      });
      if (res.ok) {
        setMessage({ text: `${providerMeta[provider].label} configuration saved to PostgreSQL.`, type: "success" });
        await fetchStatuses();
      } else {
        setMessage({ text: "Failed to save configuration.", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to save configuration.", type: "error" });
    }
    setSavingProvider(null);
  };

  const handleTestTeams = async () => {
    setTestingTeams(true);
    try {
      const webhookUrl = formState.teams.webhook_url;
      const res = await fetch("/api/teams/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Hello from TwinOps! Your personal Microsoft Teams channel is connected to Sm Ali's Digital Twin.",
          title: "TwinOps Digital Twin Connected",
          subtitle: "Responding on behalf of Sm Ali",
          webhookUrl: webhookUrl || undefined,
          facts: [
            { title: "Connected Account", value: formState.teams.email || "Personal Microsoft Account" },
            { title: "Status", value: "Live & Active" },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncFeedback((prev) => ({
          ...prev,
          teams: { success: true, message: "Adaptive card delivered to your Teams channel successfully!" },
        }));
      } else {
        setSyncFeedback((prev) => ({
          ...prev,
          teams: { success: false, message: data.error || "Failed to send message to Teams" },
        }));
      }
    } catch {
      setSyncFeedback((prev) => ({
        ...prev,
        teams: { success: false, message: "Network error sending test card to Teams" },
      }));
    }
    setTestingTeams(false);
  };

  const handleSyncNow = async (provider: Provider, route?: string) => {
    const endpoint = route || syncRoutes[provider];
    if (!endpoint) return;
    setSyncingProvider(provider);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const detail = formatSyncResult(data);
        setSyncFeedback((prev) => ({ ...prev, [provider]: { success: true, message: detail } }));
        await fetchStatuses();
      } else {
        setSyncFeedback((prev) => ({ ...prev, [provider]: { success: false, message: data.error || "Sync failed" } }));
      }
    } catch {
      setSyncFeedback((prev) => ({ ...prev, [provider]: { success: false, message: "Sync network error" } }));
    }
    setSyncingProvider(null);
  };

  const handleDisconnectGoogle = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google_drive", config: {} }),
      });
      if (res.ok) {
        setStatuses((prev) => ({ ...prev, google_drive: null }));
        setMessage({ text: "Google account disconnected.", type: "info" });
      }
    } catch {
      setMessage({ text: "Failed to disconnect.", type: "error" });
    }
  }, []);

  const isGoogleSyncing = syncingProvider === "google_drive";
  const googleFeedback = syncFeedback.google_drive;

  return (
    <div className="flex h-screen bg-[#eaf0f6]">
      {/* Sidebar nav */}
      <aside className="flex w-[260px] flex-shrink-0 flex-col border-r border-[#d8e2ed] bg-[#f1f5fa] shadow-[2px_0_8px_#cfd8e515]">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#4f46e5] text-white shadow-[3px_3px_7px_#4f46e540]">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="text-[15px] font-extrabold tracking-tight text-slate-800">TwinOps</span>
            <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Enterprise Pod</span>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] font-bold text-slate-700 bg-white border border-[#e2eaf3] shadow-[2px_2px_6px_#cfd8e5,-2px_-2px_6px_#ffffff] transition-all hover:text-indigo-600"
          >
            <ArrowLeft size={16} className="text-slate-400" />
            Back to Twin Portal
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-10 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-slate-800">
              Integrations & Real Database Connectors
            </h1>
            <p className="mt-1 text-[13.5px] font-medium text-slate-500">
              Configure personal Microsoft Teams, GitHub, and Jira connectors. All credentials save to your real PostgreSQL database.
            </p>
          </div>

          {/* Flash message */}
          {message && (
            <div
              className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-[13px] font-bold shadow-[2px_2px_6px_#cfd8e5] ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : message.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {message.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
              {message.text}
              <button
                onClick={() => setMessage(null)}
                className="ml-auto text-current opacity-60 hover:opacity-100 font-extrabold text-base"
              >
                &times;
              </button>
            </div>
          )}

          {/* Microsoft Teams Card Highlight */}
          <div className="rounded-3xl border border-[#d2dbfc] bg-gradient-to-br from-[#f6f8ff] to-[#eef2fc] p-6 shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#505ac9] text-white shadow-[3px_3px_8px_#505ac940]">
                  <Users size={22} />
                </div>
                <div>
                  <h2 className="text-[16px] font-extrabold text-slate-800">Microsoft Teams (Personal Account)</h2>
                  <p className="text-[12px] font-medium text-slate-500">Auto-answer mentions and sync chat context with your personal account</p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold border ${
                  statuses.teams?.has_config
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {statuses.teams?.has_config ? "Connected" : "Not Configured"}
              </span>
            </div>

            <div className="mb-4 space-y-3">
              {providerFields.teams.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    {field.label}
                  </label>
                  <input
                    type={field.type || "text"}
                    value={formState.teams[field.key] || ""}
                    placeholder={field.placeholder || ""}
                    onChange={(e) => handleInputChange("teams", field.key, e.target.value)}
                    className="w-full rounded-xl border border-[#d8e2ed] bg-white px-4 py-2.5 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-[12px] font-medium text-indigo-900 leading-relaxed">
              <strong>💡 How to get your Teams Webhook:</strong> In your Teams channel, click <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200">···</code> &rarr; <strong>Workflows</strong> &rarr; Select <em>&ldquo;Post to a channel when a webhook request is received&rdquo;</em> &rarr; Copy the generated URL and paste it above.
            </div>

            {syncFeedback.teams && (
              <div
                className={`mb-4 rounded-xl border px-3.5 py-2.5 text-[12px] font-bold ${
                  syncFeedback.teams.success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {syncFeedback.teams.message}
              </div>
            )}

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleSave("teams")}
                disabled={savingProvider === "teams" || testingTeams}
                className="flex items-center gap-2 rounded-xl bg-[#505ac9] px-5 py-2.5 text-[13px] font-bold text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] transition-all hover:bg-[#434cb0] disabled:opacity-50"
              >
                {savingProvider === "teams" ? "Saving..." : "Save Teams Connector"}
              </button>
              <button
                onClick={handleTestTeams}
                disabled={savingProvider === "teams" || testingTeams}
                className="flex items-center gap-2 rounded-xl border border-[#d8e2ed] bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 shadow-[3px_3px_7px_#cfd8e5] transition-all hover:bg-slate-50 disabled:opacity-50"
              >
                <Send size={14} className={testingTeams ? "animate-spin text-indigo-600" : "text-indigo-600"} />
                {testingTeams ? "Delivering..." : "Send Test Card to Teams"}
              </button>
            </div>
          </div>

          {/* Other Integrations */}
          <div>
            <h2 className="text-[16px] font-bold text-slate-800">Pod Connectors & Dev Ecosystem</h2>
            <p className="mt-0.5 text-[12.5px] font-medium text-slate-500">
              Configure credentials to ingest commit diffs, sprint boards, and Slack threads.
            </p>
          </div>

          <div className="space-y-4">
            {NON_GOOGLE_PROVIDERS.filter((p) => p !== "teams").map((provider) => {
              const meta = providerMeta[provider];
              const fields = providerFields[provider];
              const status = statuses[provider];
              const feedback = syncFeedback[provider];
              const isSyncable = SYNCABLE_PROVIDERS.includes(provider);
              const isSyncing = syncingProvider === provider;
              const isSaving = savingProvider === provider;

              return (
                <div
                  key={provider}
                  className="rounded-3xl border border-[#e2eaf3] bg-[#f1f5fa] p-6 shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-[#e2eaf3] shadow-[2px_2px_5px_#cfd8e5]">
                        {meta.icon}
                      </div>
                      <div>
                        <h3 className="text-[14.5px] font-bold text-slate-800">{meta.label}</h3>
                        <p className="text-[12px] font-medium text-slate-500">{meta.description}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-0.5 text-[10.5px] font-bold border ${
                        status?.has_config
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}
                    >
                      {status?.has_config ? "Connected" : "Not Configured"}
                    </span>
                  </div>

                  {fields.length > 0 && (
                    <div className="mb-4 space-y-3">
                      {fields.map((field) => (
                        <div key={field.key}>
                          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            {field.label}
                          </label>
                          <input
                            type={field.type || "text"}
                            value={formState[provider][field.key] || ""}
                            placeholder={field.placeholder || ""}
                            onChange={(e) => handleInputChange(provider, field.key, e.target.value)}
                            className="w-full rounded-xl border border-[#d8e2ed] bg-[#f1f5fa] px-4 py-2.5 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] focus:border-indigo-400 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {feedback && (
                    <div
                      className={`mb-4 rounded-xl border px-3.5 py-2.5 text-[12px] font-bold ${
                        feedback.success
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-rose-200 bg-rose-50 text-rose-800"
                      }`}
                    >
                      {feedback.message}
                    </div>
                  )}

                  <div className="flex gap-2.5">
                    {fields.length > 0 && (
                      <button
                        onClick={() => handleSave(provider)}
                        disabled={isSaving || isSyncing}
                        className="flex items-center gap-2 rounded-xl bg-[#4f46e5] px-5 py-2.5 text-[13px] font-bold text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] transition-all hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isSaving ? "Saving..." : `Save Configuration`}
                      </button>
                    )}
                    {isSyncable && status?.has_config && (
                      <button
                        onClick={() => handleSyncNow(provider)}
                        disabled={isSaving || isSyncing}
                        className="flex items-center gap-2 rounded-xl border border-[#e2eaf3] bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 shadow-[3px_3px_7px_#cfd8e5] transition-all hover:bg-slate-50 disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "Syncing..." : "Sync Live Data"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#eaf0f6]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
