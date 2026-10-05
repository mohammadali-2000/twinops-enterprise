"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type FormEvent,
} from "react";
import {
  Search,
  Send,
  Quote,
  Loader2,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Bot,
  Brain,
  Users,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { getCloneProfiles, fetchCloneProfiles, streamCloneChat } from "@/lib/twinops/api";
import type {
  ChatMessage,
  Citation,
  CloneProfile,
  Employee,
} from "@/lib/twinops/types";

// ---- Helpers ----

let _msgId = 0;
function nextMsgId() {
  return `msg_${++_msgId}_${Date.now()}`;
}

const AVATAR_COLORS = [
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-orange-50 text-orange-700 border-orange-200",
  "bg-teal-50 text-teal-700 border-teal-200",
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// ---- Sub-components ----

function EmployeeListItem({
  profile,
  active,
  onClick,
  colorIndex,
  hasMessages,
}: {
  profile: CloneProfile;
  active: boolean;
  onClick: () => void;
  colorIndex: number;
  hasMessages: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-all rounded-xl my-1 ${
        active
          ? "bg-[#e2eaf3] shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] text-slate-900 border-l-4 border-indigo-600"
          : "hover:bg-[#f1f5fa] text-slate-700 shadow-[2px_2px_5px_#cfd8e5,-2px_-2px_5px_#ffffff] bg-[#f1f5fa]"
      }`}
    >
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[12px] font-bold border shadow-[2px_2px_4px_#cfd8e5] ${getAvatarColor(colorIndex)}`}
      >
        {profile.employee.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span
            className={`truncate text-[13px] font-bold ${
              active ? "text-indigo-950" : "text-slate-800"
            }`}
          >
            {profile.employee.name}
          </span>
          {hasMessages && (
            <MessageSquare size={12} className="flex-shrink-0 text-indigo-500" />
          )}
        </div>
        <p className="truncate text-[11px] font-medium text-slate-500">
          {profile.employee.role} · {profile.employee.team}
        </p>
      </div>
    </button>
  );
}

function SuggestedQuestion({
  question,
  onClick,
}: {
  question: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 rounded-xl border border-[#e2eaf3] bg-[#f1f5fa] px-3.5 py-3 text-left text-[12.5px] font-medium text-slate-700 shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] transition-all hover:shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] hover:text-indigo-600"
    >
      <ArrowRight
        size={12}
        className="flex-shrink-0 text-slate-400 transition-colors group-hover:text-indigo-600"
      />
      <span className="line-clamp-2">{question}</span>
    </button>
  );
}

function ChatBubble({
  message,
  employee,
  colorIndex,
}: {
  message: ChatMessage;
  employee: Employee;
  colorIndex: number;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={`animate-fade-in-up flex gap-3 ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          isUser
            ? "bg-[#4f46e5] text-white shadow-[2px_2px_5px_#4f46e540]"
            : `border shadow-[2px_2px_4px_#cfd8e5] ${getAvatarColor(colorIndex)}`
        }`}
      >
        {isUser ? "You" : employee.initials}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-[#4f46e5] text-white shadow-[4px_4px_12px_#4f46e530]"
              : "rounded-tl-sm bg-white text-slate-800 border border-[#e2eaf3] shadow-[4px_4px_12px_#cfd8e5,-4px_-4px_12px_#ffffff]"
          }`}
        >
          <div className="whitespace-pre-line">{message.content}</div>
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {message.citations.map((c, i) => (
              <div
                key={i}
                className="inline-flex items-start gap-2 rounded-xl bg-[#f1f5fa] border border-[#d8e2ed] px-3 py-2 text-left shadow-[inset_1px_1px_3px_#cfd8e5]"
              >
                <Quote
                  size={11}
                  className="mt-0.5 flex-shrink-0 text-indigo-600"
                />
                <div>
                  <span className="text-[10px] font-bold text-indigo-700">
                    {c.source}
                  </span>
                  {c.date && (
                    <span className="text-[10px] text-slate-400">
                      {" "}
                      · {c.date}
                    </span>
                  )}
                  <p className="mt-0.5 text-[11px] italic text-slate-600 line-clamp-2">
                    &ldquo;{c.snippet}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator({
  employee,
  colorIndex,
}: {
  employee: Employee;
  colorIndex: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold border shadow-[2px_2px_4px_#cfd8e5] ${getAvatarColor(
          colorIndex
        )}`}
      >
        {employee.initials}
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white border border-[#e2eaf3] px-4 py-3 shadow-[4px_4px_12px_#cfd8e5,-4px_-4px_12px_#ffffff]">
        <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-600 [animation-delay:-0.3s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-600 [animation-delay:-0.15s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-600" />
      </div>
    </div>
  );
}

// ============================================
// Main Clones View Component
// ============================================

interface ClonesViewProps {
  demoTrigger?: number;
}

export function ClonesView({ demoTrigger = 0 }: ClonesViewProps) {
  const [profiles, setProfiles] = useState<CloneProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchCloneProfiles().then((data) => {
      setProfiles(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].employee.id);
      }
      setLoading(false);
    });
  }, []);

  const selectedProfile = profiles.find((p) => p.employee.id === selectedId);
  const messages = selectedId ? conversations[selectedId] ?? [] : [];

  const filteredProfiles = profiles.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.employee.name.toLowerCase().includes(q) ||
      p.employee.role.toLowerCase().includes(q) ||
      p.employee.team.toLowerCase().includes(q) ||
      p.expertise.some((e) => e.toLowerCase().includes(q))
    );
  });

  const teams = Array.from(new Set(filteredProfiles.map((p) => p.employee.team)));
  const groupedProfiles = teams.map((team) => ({
    team,
    members: filteredProfiles.filter((p) => p.employee.team === team),
  }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingContent]);

  useEffect(() => {
    if (selectedId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedId]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!selectedId || !question.trim() || isStreaming) return;

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMsg: ChatMessage = {
        id: nextMsgId(),
        role: "user",
        content: question.trim(),
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] ?? []), userMsg],
      }));
      setInput("");
      setIsStreaming(true);
      setStreamingContent("");
      setStreamingCitations([]);

      try {
        let accumulated = "";
        let cites: Citation[] = [];
        const currentConv = conversations[selectedId] ?? [];
        const prevMessages = [...currentConv, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const stream = streamCloneChat(
          selectedId,
          question,
          controller.signal,
          prevMessages
        );
        for await (const event of stream) {
          if (event.type === "chunk") {
            accumulated += event.text;
            setStreamingContent(accumulated);
          } else if (event.type === "citations") {
            cites = event.citations;
            setStreamingCitations(cites);
          }
        }

        const assistantMsg: ChatMessage = {
          id: nextMsgId(),
          role: "assistant",
          content: accumulated,
          timestamp: new Date().toISOString(),
          citations: cites.length > 0 ? cites : undefined,
        };

        setConversations((prev) => ({
          ...prev,
          [selectedId]: [...(prev[selectedId] ?? []), assistantMsg],
        }));
      } catch {
        // stream aborted
      }

      setIsStreaming(false);
      setStreamingContent("");
      setStreamingCitations([]);
    },
    [selectedId, isStreaming, conversations]
  );

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  useEffect(() => {
    if (demoTrigger > 0 && profiles.length > 0) {
      const first = profiles[0];
      setSelectedId(first.employee.id);
      setTimeout(() => {
        sendMessage("What are you currently focusing on?");
      }, 300);
    }
  }, [demoTrigger, profiles]);

  const profileIndex = (id: string) =>
    profiles.findIndex((p) => p.employee.id === id);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#eaf0f6]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">Loading Teammate Twins…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#eaf0f6]">
      {/* ---- Left: Clone list ---- */}
      <div className="flex w-[290px] flex-shrink-0 flex-col border-r border-[#d8e2ed] bg-[#f1f5fa] shadow-[2px_0_8px_#cfd8e515]">
        {/* Header */}
        <div className="border-b border-[#d8e2ed] px-4 py-4">
          <h2 className="text-[15px] font-bold text-slate-800">
            Pod Teammate Twins
          </h2>
          <p className="mt-0.5 text-[12px] font-medium text-slate-500">
            Consult individual domain twins
          </p>
        </div>

        {/* Search */}
        <div className="border-b border-[#d8e2ed] px-3 py-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people or skills…"
              className="w-full rounded-xl border border-[#d8e2ed] bg-[#f1f5fa] py-2 pl-9 pr-3 text-[12.5px] font-medium text-slate-800 placeholder:text-slate-400 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] focus:border-indigo-400 focus:outline-none"
            />
          </div>
        </div>

        {/* List grouped by team */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {groupedProfiles.map((group) => (
            <div key={group.team}>
              <div className="sticky top-0 z-10 bg-[#f1f5fa]/90 px-3 py-1 backdrop-blur-sm flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {group.team}
                </span>
                <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600">
                  {group.members.length}
                </span>
              </div>
              <div className="space-y-1 mt-1">
                {group.members.map((profile) => (
                  <EmployeeListItem
                    key={profile.employee.id}
                    profile={profile}
                    active={selectedId === profile.employee.id}
                    onClick={() => setSelectedId(profile.employee.id)}
                    colorIndex={profileIndex(profile.employee.id)}
                    hasMessages={
                      (conversations[profile.employee.id]?.length ?? 0) > 0
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Right: Chat area ---- */}
      <div className="flex flex-1 flex-col bg-[#eaf0f6]">
        {selectedProfile ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between border-b border-[#d8e2ed] bg-[#f1f5fa] px-6 py-3.5 shadow-[0_2px_8px_#cfd8e520]">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl text-[13px] font-bold border shadow-[3px_3px_7px_#cfd8e5,-3px_-3px_7px_#ffffff] ${getAvatarColor(
                    profileIndex(selectedProfile.employee.id)
                  )}`}
                >
                  {selectedProfile.employee.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14.5px] font-bold text-slate-800">
                      {selectedProfile.employee.name}
                    </h3>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-700 shadow-[1px_1px_3px_#cfd8e5]">
                      <Bot size={11} />
                      {selectedProfile.trainedAt
                        ? `Synced ${new Date(selectedProfile.trainedAt).toLocaleDateString()}`
                        : "Not synced yet"}
                    </span>
                  </div>
                  <p className="text-[12px] font-medium text-slate-500">
                    {selectedProfile.employee.role} ·{" "}
                    {selectedProfile.employee.team} ·{" "}
                    {selectedProfile.employee.tenure}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedProfile.expertise.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 text-[10.5px] font-semibold text-indigo-700 shadow-[1px_1px_3px_#cfd8e5]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {messages.length === 0 && !isStreaming ? (
                /* Empty state with personality + suggested questions */
                <div className="mx-auto max-w-lg text-center py-8">
                  <div className="mb-6 rounded-3xl border border-[#e2eaf3] bg-[#f1f5fa] p-6 text-center shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff]">
                    <div
                      className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-[3px_3px_8px_#cfd8e5] ${getAvatarColor(
                        profileIndex(selectedProfile.employee.id)
                      )}`}
                    >
                      <span className="text-[18px] font-bold">
                        {selectedProfile.employee.initials}
                      </span>
                    </div>
                    <h3 className="mb-1 text-[16px] font-bold text-slate-800">
                      {selectedProfile.employee.name}&apos;s Digital Twin
                    </h3>
                    <p className="text-[12.5px] font-medium leading-relaxed text-slate-600">
                      {selectedProfile.personality}
                    </p>
                  </div>

                  <p className="mb-3 text-center text-[12px] font-bold uppercase tracking-wider text-slate-400">
                    Suggested Questions
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {selectedProfile.suggestedQuestions.map((q) => (
                      <SuggestedQuestion
                        key={q}
                        question={q}
                        onClick={() => sendMessage(q)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Message list */
                <div className="mx-auto max-w-2xl space-y-5">
                  {messages.map((msg) => (
                    <ChatBubble
                      key={msg.id}
                      message={msg}
                      employee={selectedProfile.employee}
                      colorIndex={profileIndex(selectedProfile.employee.id)}
                    />
                  ))}

                  {/* Streaming message */}
                  {isStreaming && streamingContent && (
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold border shadow-[2px_2px_4px_#cfd8e5] ${getAvatarColor(
                          profileIndex(selectedProfile.employee.id)
                        )}`}
                      >
                        {selectedProfile.employee.initials}
                      </div>
                      <div className="max-w-[75%]">
                        <div className="inline-block rounded-2xl rounded-tl-sm border border-[#e2eaf3] bg-white px-4 py-3 text-[13px] leading-relaxed text-slate-800 shadow-[4px_4px_12px_#cfd8e5,-4px_-4px_12px_#ffffff]">
                          <div className="whitespace-pre-line">
                            {streamingContent}
                            <span className="inline-block h-4 w-1 animate-pulse bg-indigo-600 align-text-bottom ml-1 rounded-full" />
                          </div>
                        </div>
                        {streamingCitations.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {streamingCitations.map((c, i) => (
                              <div
                                key={i}
                                className="inline-flex items-start gap-2 rounded-xl bg-[#f1f5fa] border border-[#d8e2ed] px-3 py-2 text-left shadow-[inset_1px_1px_3px_#cfd8e5]"
                              >
                                <Quote
                                  size={11}
                                  className="mt-0.5 flex-shrink-0 text-indigo-600"
                                />
                                <div>
                                  <span className="text-[10px] font-bold text-indigo-700">
                                    {c.source}
                                  </span>
                                  {c.date && (
                                    <span className="text-[10px] text-slate-400">
                                      {" "}
                                      · {c.date}
                                    </span>
                                  )}
                                  <p className="mt-0.5 text-[11px] italic text-slate-600 line-clamp-2">
                                    &ldquo;{c.snippet}&rdquo;
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Typing indicator */}
                  {isStreaming && !streamingContent && (
                    <TypingIndicator
                      employee={selectedProfile.employee}
                      colorIndex={profileIndex(selectedProfile.employee.id)}
                    />
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-[#d8e2ed] bg-[#f1f5fa] px-6 py-4 shadow-[0_-2px_8px_#cfd8e520]">
              <form onSubmit={handleSubmit} className="flex items-end gap-3 max-w-3xl mx-auto w-full">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={`Ask ${selectedProfile.employee.name.split(" ")[0]} a question…`}
                  rows={1}
                  className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-[#d8e2ed] bg-[#f1f5fa] px-4 py-2.5 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 shadow-[inset_2px_2px_5px_#cfd8e5,inset_-2px_-2px_5px_#ffffff] focus:border-indigo-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#4f46e5] text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] transition-all hover:bg-indigo-700 hover:shadow-[inset_2px_2px_4px_#3730a3] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isStreaming ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f5fa] border border-[#e2eaf3] shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff]">
              <Sparkles size={24} className="text-indigo-600" />
            </div>
            <h3 className="mb-1 text-[16px] font-bold text-slate-800">
              Select an agent clone
            </h3>
            <p className="max-w-xs text-[13px] font-medium text-slate-500">
              Choose an employee from the list to chat with their AI digital
              twin. Each clone has unique expertise and perspective.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
