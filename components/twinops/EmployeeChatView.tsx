"use client";

import Link from "next/link";
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type FormEvent,
} from "react";
import {
  Send,
  Quote,
  Loader2,
  Bot,
  Mic,
  MicOff,
  MessageSquare,
  Volume2,
  Brain,
  Zap,
  ChevronRight,
  Search,
  Sparkles,
  CheckCircle2,
  Circle,
  Users,
} from "lucide-react";
import { fetchCloneProfiles, streamCloneChat } from "@/lib/twinops/api";
import type {
  ChatMessage,
  Citation,
  CloneProfile,
} from "@/lib/twinops/types";

// ---- Memory learning types ----

interface MemoryEntry {
  id: string;
  fact: string;
  source: string;
  timestamp: string;
  status: "extracting" | "stored";
}

const SOURCE_LABELS: Record<string, string> = {
  conversation: "Conversation",
  slack: "Slack",
  github: "GitHub",
  gdrive: "Google Drive",
  email: "Gmail",
  notion: "Notion",
  jira: "Jira",
  voice: "Voice",
  manual: "Manual",
};

// ---- Memory Panel sub-component ----

function MemoryPanel({
  entries,
  cloneName,
  isOpen,
  onToggle,
}: {
  entries: MemoryEntry[];
  cloneName: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex flex-col border-l border-[#d8e2ed] bg-[#f1f5fa] transition-all shadow-[-4px_0_12px_#cfd8e525] ${
        isOpen ? "w-[310px]" : "w-[44px]"
      }`}
    >
      {/* Toggle header */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 border-b border-[#d8e2ed] px-3 py-3.5 text-left transition-colors hover:bg-[#e6ecf4]"
      >
        <Brain size={16} className="flex-shrink-0 text-indigo-600" />
        {isOpen && (
          <div className="flex-1 min-w-0">
            <span className="text-[12px] font-bold text-slate-800 tracking-tight">
              Synced Knowledge
            </span>
            <span className="ml-1.5 rounded-full bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
              {entries.length}
            </span>
          </div>
        )}
        <ChevronRight
          size={14}
          className={`flex-shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {entries.length === 0 ? (
            <div className="px-3 py-8 text-center bg-[#f1f5fa] rounded-2xl border border-[#d8e2ed] shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff]">
              <Brain size={22} className="mx-auto mb-2 text-slate-400" />
              <p className="text-[11.5px] font-medium text-slate-500">
                Synced GitHub repos and Jira tickets appear here. Use “Sync my GitHub &amp; Jira” in the sidebar.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-[#e2eaf3] bg-white p-3 shadow-[3px_3px_8px_#cfd8e5,-3px_-3px_8px_#ffffff] transition-all"
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    {entry.status === "extracting" ? (
                      <Loader2 size={11} className="animate-spin text-amber-500" />
                    ) : (
                      <Zap size={11} className="text-indigo-600" />
                    )}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        entry.status === "extracting"
                          ? "text-amber-600"
                          : "text-indigo-600"
                      }`}
                    >
                      {entry.status === "extracting"
                        ? "Extracting…"
                        : "Stored"}
                    </span>
                    <span className="ml-auto text-[9px] font-medium text-slate-400">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-slate-700">
                    {entry.fact}
                  </p>
                  <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                    Source: <span className="font-semibold text-slate-600">{SOURCE_LABELS[entry.source] || entry.source}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Helpers ----
let _msgId = 0;
function nextMsgId() {
  return `msg_${++_msgId}_${Date.now()}`;
}

// ---- Sub-components ----

function ChatBubble({
  message,
  cloneName,
}: {
  message: ChatMessage;
  cloneName: string;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`animate-fade-in-up flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          isUser
            ? "bg-[#4f46e5] text-white shadow-[2px_2px_5px_#4f46e540]"
            : "bg-[#f1f5fa] text-indigo-700 border border-[#d8e2ed] shadow-[2px_2px_6px_#cfd8e5,-2px_-2px_6px_#ffffff]"
        }`}
      >
        {isUser ? "You" : cloneName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
      </div>
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
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {message.citations.map((c, i) => (
              <div
                key={i}
                className="inline-flex items-start gap-2 rounded-xl bg-[#f1f5fa] border border-[#d8e2ed] px-3 py-2 text-left shadow-[inset_1px_1px_3px_#cfd8e5]"
              >
                <Quote size={11} className="mt-0.5 flex-shrink-0 text-indigo-600" />
                <div>
                  <span className="text-[10px] font-bold text-indigo-700">{c.source}</span>
                  {c.date && <span className="text-[10px] text-slate-400"> · {c.date}</span>}
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

// ---- Agent Thinking Steps ----

function AgentThinkingSteps({ cloneName }: { cloneName: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1 text-[12px] font-semibold text-indigo-600">
      <Loader2 size={13} className="flex-shrink-0 animate-spin" />
      Searching {cloneName}&apos;s synced GitHub &amp; Jira memory and writing an answer…
    </div>
  );
}

// ============================================
// Main Employee Chat View
// ============================================

export function EmployeeChatView() {
  const [profile, setProfile] = useState<CloneProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>([]);
  const [memoryPanelOpen, setMemoryPanelOpen] = useState(true);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs to avoid stale closures in recording callbacks
  const isStreamingRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const modeRef = useRef(mode);
  const startRecordingRef = useRef<() => void>(() => {});

  // Keep refs in sync
  useEffect(() => { isStreamingRef.current = isStreaming; }, [isStreaming]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // Load the twin chosen on the login screen.
  useEffect(() => {
    const cloneId = sessionStorage.getItem("twinops_clone_id") || "";
    fetchCloneProfiles().then((profiles) => {
      setProfile(profiles.find((p) => p.employee.id === cloneId) ?? null);
      setLoading(false);
    });
  }, []);

  // Enumerate audio input devices
  useEffect(() => {
    async function loadDevices() {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach((t) => t.stop());
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === "audioinput");
        setAudioDevices(inputs);
        if (inputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(inputs[0].deviceId);
        }
      } catch {
        // permission denied
      }
    }
    loadDevices();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingContent]);

  // Poll for real memory entries from the backend
  const lastPollRef = useRef<string>(new Date().toISOString());
  const knownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!profile) return;
    const cid = profile.employee.id;

    knownIdsRef.current.clear();
    setMemoryEntries([]);
    lastPollRef.current = new Date().toISOString();

    fetch(`/api/memory/recent?limit=20&cloneId=${cid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.entries && data.entries.length > 0) {
          const initial: MemoryEntry[] = data.entries.map(
            (e: { id: string; fact: string; source: string; timestamp: string }) => {
              knownIdsRef.current.add(e.id);
              return {
                id: e.id,
                fact: e.fact,
                source: e.source,
                timestamp: e.timestamp,
                status: "stored" as const,
              };
            }
          );
          setMemoryEntries((prev) => {
            const extracting = prev.filter((e) => e.status === "extracting");
            return [...extracting, ...initial];
          });
        }
      })
      .catch(() => {});

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/memory/recent?limit=10&cloneId=${cid}&since=${encodeURIComponent(lastPollRef.current)}`
        );
        const data = await res.json();
        if (data.entries && data.entries.length > 0) {
          const newEntries: MemoryEntry[] = [];
          for (const e of data.entries as Array<{
            id: string;
            fact: string;
            source: string;
            timestamp: string;
          }>) {
            if (!knownIdsRef.current.has(e.id)) {
              knownIdsRef.current.add(e.id);
              newEntries.push({
                id: e.id,
                fact: e.fact,
                source: e.source,
                timestamp: e.timestamp,
                status: "stored",
              });
            }
          }
          if (newEntries.length > 0) {
            setMemoryEntries((prev) => {
              const withoutExtracting = prev.filter(
                (e) => e.status !== "extracting"
              );
              return [...newEntries, ...withoutExtracting];
            });
          }
          lastPollRef.current = data.entries[0].timestamp;
        }
      } catch {
        // polling error
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [profile]);

  // TTS: speak the assistant's response aloud
  const speakText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    try {
      setIsPlayingAudio(true);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const res = await fetch("/api/voice/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
        if (modeRef.current === "voice") {
          setTimeout(() => startRecordingRef.current(), 300);
        }
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      await audio.play();
    } catch {
      setIsPlayingAudio(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!profile || !question.trim() || isStreamingRef.current) return;

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMsg: ChatMessage = {
        id: nextMsgId(),
        role: "user",
        content: question.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsStreaming(true);
      setStreamingContent("");
      setStreamingCitations([]);

      try {
        let accumulated = "";
        let cites: Citation[] = [];
        const prevMessages = messagesRef.current.map((m) => ({ role: m.role, content: m.content }));
        const stream = streamCloneChat(
          profile.employee.id,
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
        setMessages((prev) => [...prev, assistantMsg]);

        if (modeRef.current === "voice" && accumulated.trim()) {
          speakText(accumulated);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: nextMsgId(),
            role: "assistant",
            content: "Could not reach the twin. Check that the server is running and configured.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      setIsStreaming(false);
      setStreamingContent("");
      setStreamingCitations([]);
    },
    [profile, speakText]
  );

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  // ---- Voice recording ----
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : {}),
        },
      });

      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]
        .find((t) => MediaRecorder.isTypeSupported(t)) || "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blobType = chunksRef.current[0]?.type || mimeType;
        const audioBlob = new Blob(chunksRef.current, { type: blobType });
        setIsRecording(false);

        if (audioBlob.size === 0) return;

        setIsTranscribing(true);

        try {
          const ext = blobType.includes("ogg") ? "ogg" : blobType.includes("mp4") ? "m4a" : "webm";
          const formData = new FormData();
          formData.append("audio", audioBlob, `recording.${ext}`);
          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.text?.trim()) {
              sendMessage(data.text.trim());
            }
          }
        } catch {
          // transcription error
        }
        setIsTranscribing(false);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch {
      // mic access denied
    }
  }, [sendMessage, selectedDeviceId]);

  useEffect(() => { startRecordingRef.current = startRecording; }, [startRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.requestData();
      }
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#eaf0f6]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">Loading Twin Profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center bg-[#eaf0f6]">
        <p className="text-sm font-semibold text-slate-600">
          No twin selected. <Link href="/" className="text-indigo-600 underline">Choose your twin</Link> first.
        </p>
      </div>
    );
  }

  const cloneName = profile.employee.name;
  const displayName = cloneName.replace(" [Twin Clone]", "");
  const initials = profile?.employee.initials || "??";

  return (
    <div className="flex h-full bg-[#eaf0f6]">
      {/* Chat column */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d8e2ed] bg-[#f1f5fa] px-6 py-3.5 shadow-[0_2px_8px_#cfd8e520]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f1f5fa] text-[13px] font-bold text-indigo-600 border border-[#e2eaf3] shadow-[3px_3px_7px_#cfd8e5,-3px_-3px_7px_#ffffff]">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14.5px] font-bold text-slate-800">{cloneName}</h3>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-700 shadow-[1px_1px_3px_#cfd8e5]">
                  <Bot size={11} />
                  {profile.trainedAt
                    ? `Synced ${new Date(profile.trainedAt).toLocaleDateString()}`
                    : "Not synced yet"}
                </span>
              </div>
              <p className="text-[12px] font-medium text-slate-500 line-clamp-1">
                {profile?.personality?.slice(0, 80)}
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 rounded-xl bg-[#e2eaf3] p-1 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff]">
            <button
              onClick={() => setMode("text")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all ${
                mode === "text"
                  ? "bg-[#4f46e5] text-white shadow-[2px_2px_5px_#4f46e540]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare size={13} />
              Text
            </button>
            <button
              onClick={() => setMode("voice")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all ${
                mode === "voice"
                  ? "bg-[#4f46e5] text-white shadow-[2px_2px_5px_#4f46e540]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Volume2 size={13} />
              Voice
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-[#eaf0f6] px-6 py-6">
          {messages.length === 0 && !isStreaming ? (
            <div className="mx-auto max-w-lg text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f5fa] text-indigo-600 border border-[#e2eaf3] shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff]">
                <span className="text-[22px] font-extrabold">{initials}</span>
              </div>
              <h3 className="mb-2 text-[17px] font-bold text-slate-800">
                Talk to your AI Twin
              </h3>
              <p className="mb-6 text-[13px] leading-relaxed text-slate-600 font-medium">
                {profile.personality || `Ask ${cloneName}'s twin about their GitHub repos and Jira tickets.`}
              </p>
              <div className="grid grid-cols-2 gap-2.5 mx-auto max-w-md">
                {profile.suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-xl border border-[#e2eaf3] bg-[#f1f5fa] px-3.5 py-3 text-left text-[12.5px] font-semibold text-slate-700 shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] transition-all hover:shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] hover:text-indigo-600"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-5">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} cloneName={cloneName} />
              ))}

              {/* Streaming */}
              {isStreaming && streamingContent && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#f1f5fa] text-[11px] font-bold text-indigo-600 border border-[#d8e2ed] shadow-[2px_2px_5px_#cfd8e5,-2px_-2px_5px_#ffffff]">
                    {initials}
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
                          <div key={i} className="inline-flex items-start gap-2 rounded-xl bg-[#f1f5fa] border border-[#d8e2ed] px-3 py-2 text-left shadow-[inset_1px_1px_3px_#cfd8e5]">
                            <Quote size={11} className="mt-0.5 flex-shrink-0 text-indigo-600" />
                            <div>
                              <span className="text-[10px] font-bold text-indigo-700">{c.source}</span>
                              <p className="mt-0.5 text-[11px] italic text-slate-600 line-clamp-2">&ldquo;{c.snippet}&rdquo;</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isStreaming && !streamingContent && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#f1f5fa] text-[11px] font-bold text-indigo-600 border border-[#d8e2ed] shadow-[2px_2px_5px_#cfd8e5,-2px_-2px_5px_#ffffff]">
                    {initials}
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-[#e2eaf3] bg-white px-4 py-3.5 shadow-[4px_4px_12px_#cfd8e5,-4px_-4px_12px_#ffffff]">
                    <AgentThinkingSteps cloneName={cloneName} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-[#d8e2ed] bg-[#f1f5fa] px-6 py-4 shadow-[0_-2px_8px_#cfd8e520]">
          {mode === "text" ? (
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
                placeholder="Ask your twin a question or give a briefing…"
                rows={1}
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-[#d8e2ed] bg-[#f1f5fa] px-4 py-2.5 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 shadow-[inset_2px_2px_5px_#cfd8e5,inset_-2px_-2px_5px_#ffffff] focus:border-indigo-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#4f46e5] text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] transition-all hover:bg-indigo-700 hover:shadow-[inset_2px_2px_4px_#3730a3] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          ) : (
            /* Voice mode */
            <div className="flex flex-col items-center gap-3 py-3">
              {audioDevices.length > 0 && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  disabled={isRecording || isTranscribing}
                  className="mb-1 w-64 rounded-xl border border-[#d8e2ed] bg-[#f1f5fa] px-3 py-1.5 text-[12px] font-medium text-slate-700 shadow-[inset_1px_1px_3px_#cfd8e5] outline-none"
                >
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Mic ${d.deviceId.slice(0, 8)}…`}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isStreaming || isTranscribing || isPlayingAudio}
                className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
                  isPlayingAudio
                    ? "bg-[#4f46e5] text-white shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff] animate-pulse"
                    : isRecording
                    ? "bg-rose-500 text-white shadow-[6px_6px_14px_#f43f5e50] animate-pulse"
                    : isTranscribing
                    ? "bg-amber-100 text-amber-700 border border-amber-300 shadow-[inset_2px_2px_4px_#cfd8e5]"
                    : "bg-[#f1f5fa] text-indigo-600 border border-[#e2eaf3] shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff] hover:shadow-[inset_2px_2px_5px_#cfd8e5,inset_-2px_-2px_5px_#ffffff]"
                }`}
              >
                {isPlayingAudio ? (
                  <Volume2 size={24} />
                ) : isTranscribing ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : isRecording ? (
                  <MicOff size={24} />
                ) : (
                  <Mic size={24} />
                )}
              </button>
              <p className="text-[12px] font-semibold text-slate-500">
                {isPlayingAudio
                  ? "Speaking…"
                  : isRecording
                  ? "Recording… tap to stop"
                  : isTranscribing
                  ? "Transcribing audio…"
                  : isStreaming
                  ? "Twin is responding…"
                  : "Tap to speak with your Twin"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Memory learning panel */}
      <MemoryPanel
        entries={memoryEntries}
        cloneName={displayName}
        isOpen={memoryPanelOpen}
        onToggle={() => setMemoryPanelOpen((o) => !o)}
      />
    </div>
  );
}
