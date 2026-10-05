"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import {
  Search,
  X,
  FileText,
  Users2,
  Clock,
  AlertTriangle,
  Link2,
  BookOpen,
  Brain,
  UserMinus,
  Loader2,
  Quote,
  Tag,
  Calendar,
  ExternalLink,
  CircleDot,
  ChevronDown,
} from "lucide-react";
import {
  getOnboardingOptions,
  fetchOnboardingOptions,
  generateOnboardingBrief,
  searchMemories,
  getOffboardingEmployees,
  fetchOffboardingEmployees,
  generateHandoffPack,
} from "@/lib/twinops/api";
import type {
  OnboardingBrief,
  MemoryItem,
  MemoryType,
  HandoffPack,
  Employee,
} from "@/lib/twinops/types";

// ---- Constants ----

type KnowledgeTab = "onboarding" | "memory" | "offboarding";

const SEVERITY_COLORS = {
  low: "bg-blue-50 text-blue-700 border-blue-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-rose-50 text-rose-700 border-rose-200",
};

const PRIORITY_COLORS = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  transitioning: "bg-amber-50 text-amber-700 border-amber-200",
  "needs-owner": "bg-rose-50 text-rose-700 border-rose-200",
};

// ============================================
// ONBOARDING TAB
// ============================================

function OnboardingTab({ autoTrigger }: { autoTrigger: number }) {
  const [options, setOptions] = useState(getOnboardingOptions());
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [brief, setBrief] = useState<OnboardingBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("context");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOnboardingOptions().then((opts) => setOptions(opts));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedRole || !selectedTeam) return;
    setLoading(true);
    setBrief(null);
    setError(null);
    try {
      setBrief(await generateOnboardingBrief(selectedRole, selectedTeam));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate onboarding brief");
    } finally {
      setLoading(false);
    }
  }, [selectedRole, selectedTeam]);

  useEffect(() => {
    if (autoTrigger > 0 && options.length > 0) {
      const firstOption = options[0];
      setSelectedRole(firstOption.role);
      setSelectedTeam(firstOption.team);
      setTimeout(async () => {
        setLoading(true);
        const result = await generateOnboardingBrief(
          firstOption.role,
          firstOption.team
        );
        setBrief(result);
        setLoading(false);
      }, 200);
    }
  }, [autoTrigger, options]);

  const SectionHeader = ({
    title,
    icon,
    id,
    count,
  }: {
    title: string;
    icon: React.ReactNode;
    id: string;
    count: number;
  }) => (
    <button
      onClick={() => setExpandedSection(expandedSection === id ? null : id)}
      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors hover:bg-[#e2eaf3]"
    >
      <div className="flex items-center gap-2">
        <span className="text-indigo-600">{icon}</span>
        <span className="text-[14px] font-bold text-slate-800">
          {title}
        </span>
        <span className="rounded-full bg-slate-200 border border-slate-300/50 px-2 py-0.5 text-[11px] font-bold text-slate-700">
          {count}
        </span>
      </div>
      <ChevronDown
        size={15}
        className={`text-slate-400 transition-transform ${
          expandedSection === id ? "rotate-180" : ""
        }`}
      />
    </button>
  );

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Selector card */}
      <div className="rounded-3xl border border-[#e2eaf3] bg-[#f1f5fa] p-6 shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff]">
        <h3 className="mb-1 text-[16px] font-bold text-slate-800">
          Onboarding Brief Generator
        </h3>
        <p className="mb-4 text-[13px] font-medium text-slate-500">
          Select an engineering role and team to synthesize a contextual digital onboarding briefing.
        </p>
        <div className="flex items-end gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-xl border border-[#d8e2ed] bg-[#f1f5fa] px-3.5 py-2.5 text-[13px] font-medium text-slate-800 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] outline-none"
            >
              <option value="">Select a role…</option>
              {Array.from(new Set(options.map((o) => o.role))).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Team / Pod
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full rounded-xl border border-[#d8e2ed] bg-[#f1f5fa] px-3.5 py-2.5 text-[13px] font-medium text-slate-800 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] outline-none"
            >
              <option value="">Select a team…</option>
              {Array.from(new Set(options.map((o) => o.team))).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!selectedRole || !selectedTeam || loading}
            className="flex h-11 items-center gap-2 rounded-xl bg-[#4f46e5] px-5 text-[13px] font-bold text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <BookOpen size={15} />}
            Generate Brief
          </button>
        </div>
        {error && <p className="mt-3 text-[13px] font-semibold text-rose-600">{error}</p>}
        {options.length === 0 && (
          <p className="mt-3 text-[13px] text-slate-500">No twins yet. Create twins in Settings first.</p>
        )}
      </div>

      {/* Brief content */}
      {brief && (
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Key Context */}
          <div className="rounded-3xl border border-[#e2eaf3] bg-white p-6 shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff]">
            <h4 className="mb-3 text-[15px] font-bold text-slate-800">
              Executive Context & Objectives
            </h4>
            <div className="space-y-2">
              {brief.keyContext.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[13px] font-medium text-slate-700">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                    {i + 1}
                  </span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key People */}
          <div className="rounded-2xl border border-[#e2eaf3] bg-[#f1f5fa] shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] overflow-hidden">
            <SectionHeader
              title="Key Teammates & Pod Leads"
              icon={<Users2 size={16} />}
              id="people"
              count={brief.keyPeople.length}
            />
            {expandedSection === "people" && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {brief.keyPeople.map((person, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#e2eaf3] bg-white p-3.5 shadow-[2px_2px_6px_#cfd8e5]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-slate-800">{person.name}</span>
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/50">{person.role}</span>
                    </div>
                    <p className="mt-1 text-[11.5px] font-medium text-slate-500">{person.relationship}</p>
                    {person.tip && (
                      <p className="mt-1 text-[11px] italic text-indigo-700 bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100">
                        Tip: {person.tip}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="rounded-2xl border border-[#e2eaf3] bg-[#f1f5fa] shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] overflow-hidden">
            <SectionHeader
              title="Core Architecture Specs & Docs"
              icon={<FileText size={16} />}
              id="docs"
              count={brief.keyDocs.length}
            />
            {expandedSection === "docs" && (
              <div className="p-4 space-y-2">
                {brief.keyDocs.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-[#e2eaf3] bg-white p-3.5 shadow-[2px_2px_6px_#cfd8e5]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-slate-800">{doc.title}</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">{doc.type}</span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-slate-500 font-medium">{doc.relevance}</p>
                    </div>
                    <ExternalLink size={14} className="text-indigo-600" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Decisions */}
          <div className="rounded-2xl border border-[#e2eaf3] bg-[#f1f5fa] shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] overflow-hidden">
            <SectionHeader
              title="Recent Architectural Decisions"
              icon={<Calendar size={16} />}
              id="decisions"
              count={brief.decisions.length}
            />
            {expandedSection === "decisions" && (
              <div className="p-4 space-y-2.5">
                {brief.decisions.map((d, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#e2eaf3] bg-white p-4 shadow-[2px_2px_6px_#cfd8e5]"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-md bg-indigo-50 border border-indigo-200/50 px-2 py-0.5 text-[10.5px] font-bold text-indigo-700">
                        {d.date}
                      </span>
                    </div>
                    <p className="text-[13.5px] font-bold text-slate-800">{d.decision}</p>
                    <p className="mt-1 text-[12px] text-slate-600 font-medium">{d.rationale}</p>
                    <p className="mt-1 text-[11px] text-slate-400 font-medium">Participants: {d.participants.join(", ")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risks */}
          <div className="rounded-2xl border border-[#e2eaf3] bg-[#f1f5fa] shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] overflow-hidden">
            <SectionHeader
              title="Known Bottlenecks & Landmines"
              icon={<AlertTriangle size={16} />}
              id="risks"
              count={brief.risks.length}
            />
            {expandedSection === "risks" && (
              <div className="p-4 space-y-2.5">
                {brief.risks.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#e2eaf3] bg-white p-4 shadow-[2px_2px_6px_#cfd8e5]"
                  >
                    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase mb-2 ${SEVERITY_COLORS[r.severity]}`}>
                      Severity: {r.severity}
                    </span>
                    <p className="text-[13.5px] font-bold text-slate-800">{r.risk}</p>
                    <p className="mt-1 text-[12px] text-slate-600 font-medium">{r.context}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MEMORY EXPLORER TAB (Real DB Knowledge)
// ============================================

function MemoryTab() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MemoryType | "all">("all");
  const [results, setResults] = useState<MemoryItem[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = useCallback(async (q: string, t: MemoryType | "all") => {
    setLoading(true);
    const items = await searchMemories(q, t);
    setResults(items);
    setLoading(false);
    setHasSearched(true);
  }, []);

  useEffect(() => {
    doSearch("", "all");
  }, [doSearch]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    doSearch(query, typeFilter);
  };

  return (
    <div className="flex h-full bg-[#eaf0f6]">
      {/* Results list */}
      <div className="flex flex-1 flex-col border-r border-[#d8e2ed]">
        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="border-b border-[#d8e2ed] bg-[#f1f5fa] px-6 py-4 shadow-[0_2px_6px_#cfd8e515]"
        >
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                doSearch(e.target.value, typeFilter);
              }}
              placeholder="Search episodic memories, pull requests & code embeddings…"
              className="w-full rounded-xl border border-[#d8e2ed] bg-[#f1f5fa] py-2.5 pl-9 pr-3 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div className="mt-3 flex gap-2">
            {(["all", "episodic", "semantic"] as const).map((t) => {
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTypeFilter(t);
                    doSearch(query, t);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all ${
                    active
                      ? "bg-[#4f46e5] text-white shadow-[2px_2px_5px_#4f46e540]"
                      : "bg-[#f1f5fa] text-slate-600 border border-[#e2eaf3] shadow-[2px_2px_5px_#cfd8e5,-2px_-2px_5px_#ffffff] hover:text-slate-900"
                  }`}
                >
                  {t === "episodic" ? (
                    <Clock size={12} />
                  ) : t === "semantic" ? (
                    <Brain size={12} />
                  ) : null}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              );
            })}
          </div>
        </form>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[13px] font-semibold text-slate-500">
              <Loader2 size={18} className="mr-2 animate-spin text-indigo-600" />
              Searching vector brain…
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search size={24} className="mb-2 text-slate-400" />
              <p className="text-[13px] font-medium text-slate-500">
                {hasSearched ? "No matching memory chunks found" : "Search knowledge base"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedMemory(item)}
                  className={`w-full p-4 text-left transition-all rounded-2xl border ${
                    selectedMemory?.id === item.id
                      ? "bg-[#e2eaf3] border-indigo-400 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff]"
                      : "bg-[#f1f5fa] border-[#e2eaf3] shadow-[3px_3px_8px_#cfd8e5,-3px_-3px_8px_#ffffff] hover:bg-white"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    {item.type === "episodic" ? (
                      <Clock size={13} className="text-indigo-600" />
                    ) : (
                      <Brain size={13} className="text-purple-600" />
                    )}
                    <span className="text-[13.5px] font-bold text-slate-800">
                      {item.title}
                    </span>
                  </div>
                  <p className="mb-2 line-clamp-2 text-[12px] font-medium leading-relaxed text-slate-600">
                    {item.content}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-400">
                      {new Date(item.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-slate-300">·</span>
                    <div className="flex gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="w-[440px] flex-shrink-0 overflow-y-auto bg-[#f1f5fa] border-l border-[#d8e2ed] p-6 shadow-[-4px_0_12px_#cfd8e515]">
        {selectedMemory ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10.5px] font-bold text-indigo-700">
                    {selectedMemory.type.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {selectedMemory.team}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold text-slate-800">
                  {selectedMemory.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMemory(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
              <Calendar size={13} />
              {new Date(selectedMemory.timestamp).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selectedMemory.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-[1px_1px_3px_#cfd8e5]"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="rounded-2xl border border-[#e2eaf3] bg-white p-5 shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff]">
              <p className="text-[13px] font-medium leading-relaxed text-slate-700 whitespace-pre-line">
                {selectedMemory.content}
              </p>
            </div>

            {selectedMemory.citations && selectedMemory.citations.length > 0 && (
              <div>
                <h5 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                  Grounding Sources & Commits
                </h5>
                <div className="space-y-1.5">
                  {selectedMemory.citations.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-[#e2eaf3] bg-white p-3 text-[12px] font-medium text-slate-700 shadow-[2px_2px_5px_#cfd8e5]"
                    >
                      <div className="font-bold text-indigo-700 text-[11px]">{c.source} · {c.date}</div>
                      <p className="italic text-slate-600 mt-0.5">&ldquo;{c.snippet}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Brain size={28} className="mb-3 text-slate-400" />
            <h4 className="text-[14px] font-bold text-slate-700">Select a memory</h4>
            <p className="text-[12px] font-medium text-slate-500 max-w-xs mt-1">
              Click any semantic chunk on the left to inspect full reasoning, dates, and grounding links.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// OFFBOARDING TAB
// ============================================

function OffboardingTab({ autoTrigger }: { autoTrigger: number }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [pack, setPack] = useState<HandoffPack | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOffboardingEmployees().then((data) => {
      setEmployees(data);
      if (data.length > 0 && !selectedEmpId) {
        setSelectedEmpId(data[0].id);
      }
    });
  }, []);

  const handleGenerate = async () => {
    if (!selectedEmpId) return;
    setLoading(true);
    const p = await generateHandoffPack(selectedEmpId);
    setPack(p);
    setLoading(false);
  };

  useEffect(() => {
    if (autoTrigger > 0 && employees.length > 0) {
      setSelectedEmpId(employees[0].id);
      setTimeout(async () => {
        setLoading(true);
        const p = await generateHandoffPack(employees[0].id);
        setPack(p);
        setLoading(false);
      }, 300);
    }
  }, [autoTrigger, employees]);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="rounded-3xl border border-[#e2eaf3] bg-[#f1f5fa] p-6 shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff]">
        <h3 className="mb-1 text-[16px] font-bold text-slate-800">
          Digital Handoff & Knowledge Preservation Pack
        </h3>
        <p className="mb-4 text-[13px] font-medium text-slate-500">
          Synthesize full institutional memory, outstanding pull requests, and implicit knowledge before team transitions.
        </p>
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="flex-1 rounded-xl border border-[#d8e2ed] bg-[#f1f5fa] px-3.5 py-2.5 text-[13px] font-medium text-slate-800 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] outline-none"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.role} ({e.team})
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={!selectedEmpId || loading}
            className="flex h-11 items-center gap-2 rounded-xl bg-[#4f46e5] px-5 text-[13px] font-bold text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] transition-all hover:bg-indigo-700 disabled:opacity-40"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <UserMinus size={15} />}
            Generate Pack
          </button>
        </div>
      </div>

      {pack && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="rounded-3xl border border-[#e2eaf3] bg-white p-6 shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff]">
            <h4 className="mb-3 text-[15px] font-bold text-slate-800">
              Preservation Summary & Handover Points
            </h4>
            <div className="space-y-2">
              {pack.summaryBullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[13px] font-medium text-slate-700">
                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo-600 flex-shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#e2eaf3] bg-[#f1f5fa] p-6 shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff]">
            <h4 className="mb-3 text-[14.5px] font-bold text-slate-800">
              Outstanding Work & System Ownership
            </h4>
            <div className="space-y-3">
              {pack.unresolvedWork.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#e2eaf3] bg-white p-4 shadow-[3px_3px_8px_#cfd8e5]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13.5px] font-bold text-slate-800">{item.title}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${PRIORITY_COLORS[item.priority]}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-[12px] font-medium text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main KnowledgeView
// ============================================

const tabs: { id: KnowledgeTab; label: string; icon: React.ReactNode }[] = [
  { id: "onboarding", label: "Onboarding", icon: <BookOpen size={15} /> },
  { id: "memory", label: "Memory Explorer", icon: <Brain size={15} /> },
  { id: "offboarding", label: "Offboarding", icon: <UserMinus size={15} /> },
];

interface KnowledgeViewProps {
  demoTrigger?: number;
}

export function KnowledgeView({ demoTrigger = 0 }: KnowledgeViewProps) {
  const [activeTab, setActiveTab] = useState<KnowledgeTab>("onboarding");

  return (
    <div className="flex h-full flex-col bg-[#eaf0f6]">
      {/* Tab bar */}
      <div className="flex items-center border-b border-[#d8e2ed] bg-[#f1f5fa] px-6 shadow-[0_2px_8px_#cfd8e520]">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-[13px] font-bold transition-all ${
                active
                  ? "border-indigo-600 text-indigo-700 bg-[#e6ecf4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className={active ? "text-indigo-600" : "text-slate-400"}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden bg-[#eaf0f6]">
        {activeTab === "onboarding" && (
          <OnboardingTab autoTrigger={demoTrigger} />
        )}
        {activeTab === "memory" && <MemoryTab />}
        {activeTab === "offboarding" && (
          <OffboardingTab autoTrigger={demoTrigger} />
        )}
      </div>
    </div>
  );
}
