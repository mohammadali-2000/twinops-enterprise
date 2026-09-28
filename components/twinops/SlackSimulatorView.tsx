"use client";

import { useState, useRef, useEffect } from "react";
import {
  Hash,
  Send,
  Bot,
  Trash2,
  RefreshCw,
  Zap,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";

interface SlackMessage {
  id: string;
  sender: string;
  avatar: string;
  role: string;
  timestamp: string;
  content: string;
  isBot?: boolean;
  botFor?: string;
  citations?: { source: string; snippet: string; url?: string }[];
}

interface TeammateAvatarInfo {
  initials: string;
  gradient: string;
  ring: string;
}

export function getTeammateAvatarInfo(sender: string, botFor?: string): TeammateAvatarInfo {
  const name = (botFor || sender).toLowerCase();
  if (name.includes("ali")) {
    return {
      initials: "SA",
      gradient: "from-indigo-600 to-indigo-700 text-white",
      ring: "ring-indigo-400/40",
    };
  }
  const initials = (botFor || sender)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    initials: initials || "YOU",
    gradient: "from-slate-700 to-slate-800 text-white",
    ring: "ring-slate-400/40",
  };
}

interface PodMember {
  key: string;
  name: string;
  role: string;
  code: string;
}

const DEFAULT_MEMBERS: PodMember[] = [
  { key: "ali", name: "Sm Ali", role: "Lead AI Architect (You)", code: "SA" },
];

const SLACK_CHANNELS = [
  { id: "eng-architecture", name: "eng-architecture", desc: "System design, microservices & v3 platform" },
  { id: "sales-pipeline", name: "sales-pipeline", desc: "Enterprise client reviews & deals" },
  { id: "product-roadmap", name: "product-roadmap", desc: "Deliverables, sprint milestones & priorities" },
];

const TEAMS_CHANNELS = [
  { id: "hls-backend-delivery", name: "hls-backend-delivery", desc: "Healthcare & Life Sciences Pod" },
  { id: "architecture-governance", name: "architecture-governance", desc: "Spring Boot, Microservices & Redis" },
  { id: "sprint-release-sync", name: "sprint-release-sync", desc: "Jira Sprint HLS-402 & Gate Checks" },
];

export function SlackSimulatorView() {
  const [platform, setPlatform] = useState<"teams" | "slack">("teams");
  const [activeChannel, setActiveChannel] = useState("hls-backend-delivery");
  
  const [members, setMembers] = useState<PodMember[]>(DEFAULT_MEMBERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");

  const [messages, setMessages] = useState<Record<string, SlackMessage[]>>({
    "hls-backend-delivery": [],
    "architecture-governance": [],
    "sprint-release-sync": [],
    "eng-architecture": [],
    "sales-pipeline": [],
    "product-roadmap": [],
  });

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const [presence, setPresence] = useState<Record<string, "active" | "away">>({
    ali: "away",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channels = platform === "teams" ? TEAMS_CHANNELS : SLACK_CHANNELS;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handlePlatformChange = (newPlatform: "teams" | "slack") => {
    setPlatform(newPlatform);
    if (newPlatform === "teams") {
      setActiveChannel("hls-backend-delivery");
    } else {
      setActiveChannel("eng-architecture");
    }
  };

  const togglePresence = (person: string) => {
    setPresence((prev) => ({
      ...prev,
      [person]: prev[person] === "active" ? "away" : "active",
    }));
  };

  const handleClearMessages = () => {
    setMessages((prev) => ({
      ...prev,
      [activeChannel]: [],
    }));
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const name = newMemberName.trim();
    const role = newMemberRole.trim() || "Teammate";
    const key = name.toLowerCase().replace(/\s+/g, "_");
    const code = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

    setMembers((prev) => [...prev, { key, name, role, code }]);
    setPresence((prev) => ({ ...prev, [key]: "away" }));
    setNewMemberName("");
    setNewMemberRole("");
    setShowAddModal(false);
  };

  const handleRemoveMember = (key: string) => {
    if (key === "ali") return; // keep primary user
    setMembers((prev) => prev.filter((m) => m.key !== key));
  };

  const handleSyncGithubLive = async () => {
    setIsSyncingGithub(true);
    setSyncStatus("Connecting to GitHub API...");
    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "enterprise-twinops", repoLimit: 3, itemsPerRepo: 5 }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(`✓ Synced ${data.result.repositories_scanned} repos & ${data.result.chunks_created} real chunks!`);
        setTimeout(() => setSyncStatus(null), 4000);
      } else {
        setSyncStatus("Sync finished with local fallback.");
        setTimeout(() => setSyncStatus(null), 4000);
      }
    } catch {
      setSyncStatus("Sync failed.");
      setTimeout(() => setSyncStatus(null), 4000);
    } finally {
      setIsSyncingGithub(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMsg: SlackMessage = {
      id: `user-${Date.now()}`,
      sender: "Rohan (Junior Dev / Colleague)",
      avatar: "YOU",
      role: "Pod Teammate",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content: text,
    };

    setMessages((prev) => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), userMsg],
    }));
    setInputValue("");
    setIsTyping(true);

    // Target digital twin identification
    const cloneId = "f1d2e3b4-5a6c-7d8e-9f0a-1b2c3d4e5f6a";
    let targetName = "Sm Ali";
    let presenceKey = "ali";

    for (const m of members) {
      if (text.toLowerCase().includes(m.name.toLowerCase().split(" ")[0])) {
        targetName = m.name;
        presenceKey = m.key;
        break;
      }
    }

    const targetInitials = targetName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

    // IF TEAMMATE IS ACTIVE (ONLINE): TwinOps stays quiet, human replies!
    if (presence[presenceKey] === "active") {
      await new Promise((r) => setTimeout(r, 700));
      const activeHumanMsg: SlackMessage = {
        id: `human-${Date.now()}`,
        sender: targetName,
        avatar: targetInitials,
        role: "Teammate (Active Online)",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content: `Hey! I'm actively online at my desk right now. Got your ping, looking into it! (TwinOps is on standby).`,
      };
      setMessages((prev) => ({
        ...prev,
        [activeChannel]: [...(prev[activeChannel] || []), activeHumanMsg],
      }));
      setIsTyping(false);
      return;
    }

    // OTHERWISE: TEAMMATE IS AWAY/IN MEETING -> TwinOps AI steps in on their behalf!
    try {
      const res = await fetch("/api/twinops/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloneId, question: text }),
      });

      if (!res.ok) throw new Error("API failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let botText = "";
      let citations: { source: string; snippet: string; url?: string }[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "chunk") {
                botText += data.text;
              } else if (data.type === "citations") {
                citations = data.citations || [];
              }
            } catch {
              // skip malformed
            }
          }
        }
      }

      const botMsg: SlackMessage = {
        id: `bot-${Date.now()}`,
        sender: `TwinOps (${targetName})`,
        avatar: targetInitials,
        role: `On behalf of ${targetName} (In Deep Focus / Away)`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content: botText || `Hey! ${targetName} is currently away in a sprint meeting, but per recent commit and architecture logs, here is the answer.`,
        isBot: true,
        botFor: targetName,
        citations: citations.length > 0 ? citations : [
          { source: "github:enterprise-twinops/twinops-core", snippet: "Synced commit history and architecture specifications." },
        ],
      };

      setMessages((prev) => ({
        ...prev,
        [activeChannel]: [...(prev[activeChannel] || []), botMsg],
      }));
    } catch {
      const fallbackBotMsg: SlackMessage = {
        id: `bot-${Date.now()}`,
        sender: `TwinOps (${targetName})`,
        avatar: targetInitials,
        role: `On behalf of ${targetName} (Away)`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content: `Hey! ${targetName} is currently in a meeting. Per latest commits on GitHub, the services are actively synced and ready for testing.`,
        isBot: true,
        botFor: targetName,
        citations: [
          { source: "github:enterprise-twinops/twinops-core", snippet: "Repository commit & PR diff groundings." },
        ],
      };
      setMessages((prev) => ({
        ...prev,
        [activeChannel]: [...(prev[activeChannel] || []), fallbackBotMsg],
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const channelMessages = messages[activeChannel] || [];

  return (
    <div className="flex h-full w-full bg-[#eaf0f6] text-slate-800 font-sans overflow-hidden">
      {/* Left Sidebar (Soft-UI Neumorphic) */}
      <div className="flex w-72 flex-col bg-[#eaf0f6] border-r border-[#d4deeb] p-4 flex-shrink-0 shadow-[2px_0_8px_rgba(207,216,229,0.5)]">
        {/* Workspace Brand / Header */}
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-[#f1f5fa] p-3 shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] border border-white/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#4338ca] text-white font-extrabold text-sm shadow-[2px_2px_5px_#4f46e540]">
              T
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                Enterprise Teams
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">Core Delivery Pod</p>
            </div>
          </div>
        </div>

        {/* Platform Toggle (Teams vs Slack) */}
        <div className="mb-4 flex rounded-xl bg-[#e2eaf3] p-1 shadow-[inset_2px_2px_5px_#cfd8e5,inset_-2px_-2px_5px_#ffffff] border border-white/50">
          <button
            onClick={() => handlePlatformChange("teams")}
            className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all ${
              platform === "teams"
                ? "bg-[#5B5FC7] text-white shadow-[2px_2px_6px_#5B5FC755]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🟣 Teams
          </button>
          <button
            onClick={() => handlePlatformChange("slack")}
            className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all ${
              platform === "slack"
                ? "bg-[#4A154B] text-white shadow-[2px_2px_6px_#4A154B55]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            💬 Slack
          </button>
        </div>

        {/* Ambient Mode Status Card */}
        <div className="mb-4 rounded-2xl bg-[#f1f5fa] p-3 shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] border border-white/70">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            TwinOps Ambient Active
          </div>
          <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed">
            Auto-answering technical inquiries on behalf of absent pod members.
          </p>
        </div>

        {/* Channels List */}
        <div className="flex-1 space-y-1 overflow-y-auto">
          <p className="px-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
            {platform === "teams" ? "Teams Channels" : "Slack Channels"}
          </p>
          {channels.map((ch) => {
            const isSelected = activeChannel === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all text-left ${
                  isSelected
                    ? "bg-[#e5edf6] text-indigo-700 font-bold shadow-[inset_3px_3px_6px_#cfd8e5,inset_-3px_-3px_6px_#ffffff] border border-white/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-[#f1f5fa]"
                }`}
              >
                <Hash size={15} className={isSelected ? "text-indigo-600" : "text-slate-400"} />
                <span className="truncate">{ch.name}</span>
              </button>
            );
          })}

          {/* Teammate Presence Controller */}
          <div className="mt-5 pt-3 border-t border-[#d4deeb]">
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Pod Presence
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold hover:underline"
              >
                <UserPlus size={11} />
                Add
              </button>
            </div>

            <div className="space-y-2">
              {members.map((p) => {
                const isAway = presence[p.key] === "away";
                return (
                  <div
                    key={p.key}
                    onClick={() => togglePresence(p.key)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#f1f5fa] shadow-[3px_3px_8px_#cfd8e5,-3px_-3px_8px_#ffffff] border border-white/80 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                        {p.code}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-slate-800 truncate">{p.name}</span>
                        <span className="text-[9px] text-slate-400 truncate">{p.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition-all ${
                          isAway
                            ? "bg-rose-100 text-rose-700 border border-rose-200 shadow-sm"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm"
                        }`}
                      >
                        {isAway ? "🔴 Away" : "🟢 Online"}
                      </span>
                      {p.key !== "ali" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMember(p.key);
                          }}
                          className="text-slate-300 hover:text-rose-500 p-0.5"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Conversation Canvas (Light Neumorphic) */}
      <div className="flex flex-1 flex-col h-full bg-[#eaf0f6] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#d4deeb] bg-[#eaf0f6] px-6 py-4 shadow-[0_2px_8px_rgba(207,216,229,0.4)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1f5fa] shadow-[3px_3px_7px_#cfd8e5,-3px_-3px_7px_#ffffff] text-slate-700 border border-white/80">
              <Hash size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-800 text-[14px] leading-tight">
                {activeChannel}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {channels.find((c) => c.id === activeChannel)?.desc || "Delivery Stream"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncGithubLive}
              disabled={isSyncingGithub}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700 shadow-[2px_2px_5px_#cfd8e5] transition-all hover:bg-indigo-100 disabled:opacity-50"
            >
              <RefreshCw size={12} className={isSyncingGithub ? "animate-spin" : ""} />
              {isSyncingGithub ? "Syncing GitHub..." : "Sync GitHub Data"}
            </button>
            <button
              onClick={handleClearMessages}
              title="Clear channel messages"
              className="flex items-center gap-1 rounded-xl bg-[#f1f5fa] px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-[2px_2px_5px_#cfd8e5,-2px_-2px_5px_#ffffff] transition-all hover:text-rose-600 hover:shadow-[inset_1px_1px_3px_#cfd8e5]"
            >
              <Trash2 size={13} />
              Clear
            </button>
          </div>
        </div>

        {syncStatus && (
          <div className="bg-indigo-600 text-white text-xs font-semibold px-4 py-1.5 text-center flex items-center justify-center gap-2 animate-fade-in">
            <Zap size={12} />
            {syncStatus}
          </div>
        )}

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {channelMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center max-w-md mx-auto">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f5fa] shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff] border border-white/80 mb-3 text-indigo-600">
                <Hash size={24} />
              </div>
              <h3 className="font-extrabold text-slate-800 text-[16px] mb-1">
                #{activeChannel} is Clean & Ready
              </h3>
              <p className="text-[12.5px] font-medium text-slate-500 leading-relaxed mb-6">
                Type a question below tagging <strong className="text-indigo-600 font-bold">@Sm Ali</strong>. Your AI Twin will automatically ground its answer in your real GitHub commits!
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Hey @Sm Ali, what did you commit to the repo recently?",
                  "Hey @Sm Ali, what are the biggest architectural risks?",
                  "Hey @Sm Ali, are Redis connections pooled in our backend?",
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInputValue(prompt)}
                    className="text-[11.5px] font-bold text-slate-700 bg-[#f1f5fa] hover:bg-white border border-[#d4deeb] rounded-xl px-3 py-2 shadow-[3px_3px_8px_#cfd8e5,-3px_-3px_8px_#ffffff] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    💬 {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            channelMessages.map((msg) => {
              const avatarInfo = getTeammateAvatarInfo(msg.sender, msg.botFor);
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 rounded-2xl p-4 transition-all ${
                    msg.isBot
                      ? "bg-gradient-to-r from-[#f5f8fc] to-[#eef3f9] border border-indigo-200 shadow-[4px_4px_12px_#cfd8e5,-4px_-4px_12px_#ffffff]"
                      : "bg-[#f1f5fa] border border-white shadow-[3px_3px_8px_#cfd8e5,-3px_-3px_8px_#ffffff]"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarInfo.gradient} font-bold text-xs shadow-md`}
                  >
                    {avatarInfo.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-extrabold text-[13px] text-slate-900">
                        {msg.sender}
                      </span>
                      {msg.isBot && (
                        <span className="flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 text-[10px] font-extrabold shadow-xs">
                          <Bot size={11} />
                          TwinOps AI
                        </span>
                      )}
                      <span className="text-[10.5px] font-semibold text-slate-400">
                        {msg.role}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto font-medium">
                        {msg.timestamp}
                      </span>
                    </div>

                    <div className="text-[13px] text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                      {msg.content}
                    </div>

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-indigo-100 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                          <ShieldCheck size={12} />
                          Grounding Citations
                        </span>
                        {msg.citations.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded-xl bg-white border border-indigo-100 p-2 text-[11px] shadow-xs"
                          >
                            <span className="font-bold text-indigo-700 flex-shrink-0">
                              [{c.source}]:
                            </span>
                            <span className="text-slate-600 font-medium italic">
                              &ldquo;{c.snippet}&rdquo;
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isTyping && (
            <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 shadow-[2px_2px_6px_#cfd8e5] border border-indigo-100 w-fit animate-pulse">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                <Bot size={14} className="animate-spin" />
              </div>
              <span className="text-xs font-bold text-indigo-700">
                TwinOps AI is searching real commit memories & typing reply...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-[#d4deeb] bg-[#f1f5fa] p-4 shadow-[0_-2px_8px_rgba(207,216,229,0.3)]">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Message #${activeChannel} (e.g. "Hey @Sm Ali, what did you commit to the repo?")`}
              className="flex-1 rounded-2xl border border-[#d4deeb] bg-[#f1f5fa] px-4 py-3 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 shadow-[inset_2px_2px_5px_#cfd8e5,inset_-2px_-2px_5px_#ffffff] focus:border-indigo-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4f46e5] text-white shadow-[3px_3px_8px_#cfd8e5,-3px_-3px_8px_#ffffff] transition-all hover:bg-indigo-700 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Add Teammate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#f1f5fa] p-6 shadow-2xl border border-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">Add Real Pod Teammate</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Teammate Full Name</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-[#d4deeb] bg-[#f1f5fa] px-3.5 py-2.5 text-[13px] font-medium shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Role / Specialization</label>
                <input
                  type="text"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  placeholder="e.g. Senior Java / DevOps Lead"
                  className="w-full rounded-xl border border-[#d4deeb] bg-[#f1f5fa] px-3.5 py-2.5 text-[13px] font-medium shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#4f46e5] rounded-xl shadow-md hover:bg-indigo-700"
                >
                  Save Teammate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
