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
  Play,
  X,
  ChevronRight,
  Users,
  Filter,
  RotateCcw,
  ArrowRight,
  Quote,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { streamInsightsQuery, getAvailableTeams } from "@/lib/twinops/api";
import type {
  StreamStage,
  QueryPlan,
  EmployeeResponse,
  AggregationResult,
  InsightsFilters,
  Theme,
  Stance,
  StanceDistribution,
} from "@/lib/twinops/types";

// ---- Constants ----

const STANCE_COLORS: Record<Stance, string> = {
  support: "#059669",
  neutral: "#d97706",
  oppose: "#e11d48",
};

const STANCE_BG: Record<Stance, string> = {
  support: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  neutral: "bg-amber-50 text-amber-700 border-amber-200/80",
  oppose: "bg-rose-50 text-rose-700 border-rose-200/80",
};

const STANCE_LABELS: Record<Stance, string> = {
  support: "Support",
  neutral: "Neutral",
  oppose: "Oppose",
};

// ---- Sub-components ----

function StageIndicator({ stage }: { stage: StreamStage }) {
  const stages: { key: StreamStage; label: string }[] = [
    { key: "planning", label: "Plan" },
    { key: "querying", label: "Query Pod Twins" },
    { key: "aggregating", label: "Aggregate" },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {stages.map((s, i) => {
        const stageOrder = ["planning", "querying", "aggregating", "complete"];
        const currentIdx = stageOrder.indexOf(stage);
        const thisIdx = stageOrder.indexOf(s.key);
        const isActive = stage === s.key;
        const isDone = currentIdx > thisIdx;

        return (
          <div key={s.key} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight
                size={12}
                className={isDone ? "text-indigo-600" : "text-slate-300"}
              />
            )}
            <div
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11.5px] font-bold transition-all ${
                isActive
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-[inset_1px_1px_3px_#cfd8e5]"
                  : isDone
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-[1px_1px_3px_#cfd8e5]"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {isDone ? (
                <CheckCircle2 size={12} />
              ) : isActive ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Clock size={12} />
              )}
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StanceBar({
  distribution,
  previous,
  animated,
}: {
  distribution: StanceDistribution;
  previous?: StanceDistribution | null;
  animated?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex h-3.5 overflow-hidden rounded-full bg-slate-200 p-0.5 shadow-[inset_1px_1px_3px_#cfd8e5]">
        <div
          className="transition-all duration-700 rounded-l-full"
          style={{
            width: `${distribution.support}%`,
            backgroundColor: STANCE_COLORS.support,
          }}
        />
        <div
          className="transition-all duration-700"
          style={{
            width: `${distribution.neutral}%`,
            backgroundColor: STANCE_COLORS.neutral,
          }}
        />
        <div
          className="transition-all duration-700 rounded-r-full"
          style={{
            width: `${distribution.oppose}%`,
            backgroundColor: STANCE_COLORS.oppose,
          }}
        />
      </div>
      <div className="flex items-center justify-between text-[12px]">
        {(["support", "neutral", "oppose"] as Stance[]).map((s) => {
          const val = distribution[s];
          const prev = previous?.[s];
          const delta = prev != null ? val - prev : null;
          return (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shadow-[1px_1px_2px_#00000020]"
                style={{ backgroundColor: STANCE_COLORS[s] }}
              />
              <span className="font-bold text-slate-800">
                {STANCE_LABELS[s]} {val}%
              </span>
              {delta != null && delta !== 0 && animated && (
                <span
                  className={`text-[11px] font-bold ${
                    delta > 0
                      ? s === "oppose"
                        ? "text-rose-600"
                        : "text-emerald-600"
                      : s === "oppose"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {delta}pp
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  onClick,
  previousCount,
}: {
  theme: Theme;
  onClick: () => void;
  previousCount?: number;
}) {
  const delta =
    previousCount != null ? theme.count - previousCount : null;
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-2xl border border-[#e2eaf3] bg-white p-4 text-left shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] transition-all hover:shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff]"
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-bold ${STANCE_BG[theme.dominantStance]}`}
        >
          {STANCE_LABELS[theme.dominantStance]}
        </span>
        <div className="flex items-center gap-1 text-[12px] font-bold text-slate-500">
          <Users size={12} />
          {theme.count}
          {delta != null && delta !== 0 && (
            <span
              className={`ml-1 font-bold ${
                delta > 0 ? "text-indigo-600" : "text-slate-400"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {delta}
            </span>
          )}
        </div>
      </div>
      <h4 className="mb-1 text-[13.5px] font-bold text-slate-800 group-hover:text-indigo-600">
        {theme.label}
      </h4>
      <p className="text-[12px] font-medium leading-relaxed text-slate-500 line-clamp-2">
        {theme.description}
      </p>
    </button>
  );
}

function EmployeeCard({
  response,
  onClick,
  index,
}: {
  response: EmployeeResponse;
  onClick: () => void;
  index: number;
}) {
  const avatarColors = [
    "bg-indigo-50 text-indigo-700 border-indigo-200",
    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "bg-amber-50 text-amber-700 border-amber-200",
    "bg-rose-50 text-rose-700 border-rose-200",
    "bg-purple-50 text-purple-700 border-purple-200",
    "bg-sky-50 text-sky-700 border-sky-200",
  ];
  const color = avatarColors[index % avatarColors.length];

  return (
    <button
      onClick={onClick}
      className="animate-fade-in-up group w-full rounded-2xl border border-[#e2eaf3] bg-white p-4 text-left shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] transition-all hover:shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff]"
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-[12px] font-bold border shadow-[2px_2px_4px_#cfd8e5] ${color}`}
        >
          {response.employee.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <span className="text-[14px] font-bold text-slate-800">
                {response.employee.name}
              </span>
              <span className="ml-2 text-[11.5px] font-medium text-slate-500">
                {response.employee.role} · {response.employee.team}
              </span>
            </div>
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-bold ${STANCE_BG[response.stance]}`}
            >
              {STANCE_LABELS[response.stance]}
            </span>
          </div>
          <p className="text-[12.5px] font-medium leading-relaxed text-slate-600">
            {response.summary}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
            <span>Confidence: {Math.round(response.confidence * 100)}%</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-indigo-600 group-hover:text-indigo-800">
              View reasoning <ArrowRight size={11} />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function DetailDrawer({
  response,
  onClose,
}: {
  response: EmployeeResponse;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="animate-slide-in-right relative z-10 flex h-full w-full max-w-lg flex-col bg-[#f1f5fa] shadow-2xl border-l border-[#d8e2ed]">
        <div className="flex items-center justify-between border-b border-[#d8e2ed] px-6 py-4 bg-white">
          <div>
            <h3 className="text-[16px] font-bold text-slate-800">
              {response.employee.name}
            </h3>
            <p className="text-[12px] font-medium text-slate-500">
              {response.employee.role} · {response.employee.team} ·{" "}
              {response.employee.tenure}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Position & Confidence
            </div>
            <span
              className={`inline-flex items-center rounded-xl border px-3 py-1 text-[13px] font-bold ${STANCE_BG[response.stance]}`}
            >
              {STANCE_LABELS[response.stance]} · {Math.round(response.confidence * 100)}% Confidence
            </span>
          </div>

          <div className="rounded-2xl border border-[#e2eaf3] bg-white p-4 shadow-[3px_3px_8px_#cfd8e5]">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Stance Summary
            </div>
            <p className="text-[13.5px] font-semibold leading-relaxed text-slate-800">
              {response.summary}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2eaf3] bg-white p-4 shadow-[3px_3px_8px_#cfd8e5]">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Detailed AI Twin Reasoning
            </div>
            <p className="text-[13px] font-medium leading-relaxed text-slate-600">
              {response.reasoning}
            </p>
          </div>

          <div>
            <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Grounding Citations
            </div>
            <div className="space-y-2">
              {response.citations.map((c, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#e2eaf3] bg-white p-3.5 shadow-[2px_2px_5px_#cfd8e5]"
                >
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                    <Quote size={11} />
                    <span>{c.source}</span>
                    <span className="text-slate-400 font-normal">· {c.date}</span>
                  </div>
                  <p className="text-[12px] italic text-slate-600 line-clamp-3">
                    &ldquo;{c.snippet}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeDrawer({
  theme,
  responses,
  onClose,
  onSelectEmployee,
}: {
  theme: Theme;
  responses: EmployeeResponse[];
  onClose: () => void;
  onSelectEmployee: (r: EmployeeResponse) => void;
  }) {
  const themeEmployees = responses.filter((r) =>
    theme.employeeIds.includes(r.employee.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="animate-slide-in-right relative z-10 flex h-full w-full max-w-lg flex-col bg-[#f1f5fa] shadow-2xl border-l border-[#d8e2ed]">
        <div className="flex items-center justify-between border-b border-[#d8e2ed] px-6 py-4 bg-white">
          <div>
            <span
              className={`mb-1 inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-bold ${STANCE_BG[theme.dominantStance]}`}
            >
              {STANCE_LABELS[theme.dominantStance]}
            </span>
            <h3 className="text-[16px] font-bold text-slate-800">
              {theme.label}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="rounded-2xl border border-[#e2eaf3] bg-white p-4 shadow-[3px_3px_8px_#cfd8e5]">
            <p className="text-[13px] font-medium leading-relaxed text-slate-700">
              {theme.description}
            </p>
          </div>

          <div>
            <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Teammate Twins in this theme ({themeEmployees.length})
            </div>
            <div className="space-y-2">
              {themeEmployees.map((r) => (
                <button
                  key={r.employee.id}
                  onClick={() => {
                    onClose();
                    setTimeout(() => onSelectEmployee(r), 100);
                  }}
                  className="w-full rounded-xl border border-[#e2eaf3] bg-white p-3.5 text-left shadow-[2px_2px_6px_#cfd8e5] transition-all hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] font-bold text-slate-800">
                      {r.employee.name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-bold ${STANCE_BG[r.stance]}`}
                    >
                      {STANCE_LABELS[r.stance]}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] font-medium text-slate-500 line-clamp-1">
                    {r.summary}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Management Insights Component
// ============================================

export function InsightsView() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<StreamStage>("idle");
  const [plan, setPlan] = useState<QueryPlan | null>(null);
  const [responses, setResponses] = useState<EmployeeResponse[]>([]);
  const [aggregation, setAggregation] = useState<AggregationResult | null>(
    null
  );
  const [filters, setFilters] = useState<InsightsFilters>({
    teams: [],
  });
  const [previousAggregation, setPreviousAggregation] =
    useState<AggregationResult | null>(null);
  const [previousThemeCounts, setPreviousThemeCounts] = useState<
    Record<string, number>
  >({});
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeResponse | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const responsesEndRef = useRef<HTMLDivElement>(null);

  const runQuery = useCallback(
    async (q: string, f: InsightsFilters) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (aggregation) {
        setPreviousAggregation(aggregation);
        const counts: Record<string, number> = {};
        aggregation.themes.forEach((t) => (counts[t.id] = t.count));
        setPreviousThemeCounts(counts);
      }

      setIsRunning(true);
      setError(null);
      setResponses([]);
      setAggregation(null);
      setStage("idle");
      setPlan(null);

      try {
        const stream = streamInsightsQuery(q, f, controller.signal);
        for await (const event of stream) {
          switch (event.type) {
            case "stage":
              setStage(event.stage);
              break;
            case "plan":
              setPlan(event.plan);
              break;
            case "employee_response":
              setResponses((prev) => [...prev, event.response]);
              break;
            case "aggregation":
              setAggregation(event.data);
              break;
          }
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(err instanceof Error ? err.message : "Analysis failed");
          setStage("complete");
        }
      }
      setIsRunning(false);
    },
    [aggregation]
  );

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      if (!query.trim() || isRunning) return;
      setPreviousAggregation(null);
      setPreviousThemeCounts({});
      runQuery(query, filters);
    },
    [query, filters, isRunning, runQuery]
  );

  const handleFilterChange = useCallback(
    (newFilters: InsightsFilters) => {
      setFilters(newFilters);
      if (query.trim() && stage === "complete") {
        runQuery(query, newFilters);
      }
    },
    [query, stage, runQuery]
  );

  useEffect(() => {
    responsesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses.length]);

  const showDelta = previousAggregation != null && aggregation != null;

  return (
    <div className="flex h-full bg-[#eaf0f6]">
      {/* ---- Left Panel ---- */}
      <div className="flex w-[390px] flex-shrink-0 flex-col border-r border-[#d8e2ed] bg-[#f1f5fa] shadow-[2px_0_8px_#cfd8e515]">
        {/* Header */}
        <div className="border-b border-[#d8e2ed] px-5 py-4">
          <h2 className="text-[15px] font-bold text-slate-800">
            Pod Alignment & Polling
          </h2>
          <p className="mt-0.5 text-[12px] font-medium text-slate-500">
            Ask every twin the same question and compare their answers
          </p>
        </div>

        {/* Query input */}
        <form onSubmit={handleSubmit} className="border-b border-[#d8e2ed] p-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Are we ready to release this sprint? What is blocking us?"
            rows={3}
            className="mb-3 w-full resize-none rounded-xl border border-[#d8e2ed] bg-[#f1f5fa] px-3.5 py-2.5 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] focus:border-indigo-400 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <button
            type="submit"
            disabled={!query.trim() || isRunning}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4f46e5] px-4 py-2.5 text-[13px] font-bold text-white shadow-[4px_4px_10px_#cfd8e5,-4px_-4px_10px_#ffffff] transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isRunning ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Play size={15} />
            )}
            {isRunning ? "Asking twins…" : "Ask all twins"}
          </button>
        </form>

        {/* Stage indicator */}
        {stage !== "idle" && (
          <div className="border-b border-[#d8e2ed] px-4 py-3">
            <StageIndicator stage={stage} />
          </div>
        )}

        {/* Filters */}
        {stage !== "idle" && (
          <div className="border-b border-[#d8e2ed] px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Filter size={12} />
              Filter by Pod
            </div>
            <div className="flex flex-wrap gap-1.5">
              {getAvailableTeams().map((team) => {
                const active = filters.teams.includes(team);
                return (
                  <button
                    key={team}
                    onClick={() => {
                      const newTeams = active
                        ? filters.teams.filter((t) => t !== team)
                        : [...filters.teams, team];
                      handleFilterChange({ ...filters, teams: newTeams });
                    }}
                    disabled={isRunning}
                    className={`rounded-xl px-2.5 py-1 text-[11.5px] font-bold transition-all ${
                      active
                        ? "bg-[#4f46e5] text-white shadow-[2px_2px_5px_#4f46e540]"
                        : "bg-[#f1f5fa] text-slate-600 border border-[#e2eaf3] shadow-[2px_2px_5px_#cfd8e5,-2px_-2px_5px_#ffffff]"
                    }`}
                  >
                    {team}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Plan */}
        {plan && (
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Execution Plan
            </div>
            <div className="space-y-2">
              {plan.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-[12.5px] font-medium text-slate-600"
                >
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---- Right Panel ---- */}
      <div className="flex-1 overflow-y-auto bg-[#eaf0f6] px-6 py-6">
        {stage === "idle" ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f5fa] border border-[#e2eaf3] shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff]">
              <Search size={24} className="text-indigo-600" />
            </div>
            <h3 className="mb-1 text-[16px] font-bold text-slate-800">
              Ask the whole team at once
            </h3>
            <p className="max-w-sm text-[13px] font-medium text-slate-500">
              Each twin answers from its own synced GitHub and Jira data, with citations. TwinOps then summarizes where the team agrees and disagrees.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[13px] font-semibold text-rose-700">
                {error}
              </div>
            )}

            {/* Aggregation Summary */}
            {aggregation && (
              <div className="animate-fade-in rounded-3xl border border-[#e2eaf3] bg-[#f1f5fa] p-6 shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-slate-800">
                    Pod Population Sentiment
                  </h3>
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
                    <Users size={13} />
                    {aggregation.totalResponses} Responses
                    <span className="text-slate-300">·</span>
                    <span>
                      {Math.round(aggregation.overallConfidence * 100)}% Confidence
                    </span>
                  </div>
                </div>

                <StanceBar
                  distribution={aggregation.distribution}
                  previous={showDelta ? previousAggregation?.distribution : null}
                  animated={showDelta}
                />

                <p className="mt-4 text-[13px] font-medium leading-relaxed text-slate-700 bg-white p-4 rounded-2xl border border-[#e2eaf3] shadow-[inset_1px_1px_3px_#cfd8e5]">
                  {aggregation.summary}
                </p>
              </div>
            )}

            {/* Themes */}
            {aggregation && aggregation.themes.length > 0 && (
              <div className="animate-fade-in">
                <h3 className="mb-3 text-[14.5px] font-bold text-slate-800">
                  Key Organizational Themes
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {aggregation.themes.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      onClick={() => setSelectedTheme(theme)}
                      previousCount={previousThemeCounts[theme.id]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Employee Responses */}
            {responses.length > 0 && (
              <div>
                <h3 className="mb-3 text-[14.5px] font-bold text-slate-800">
                  Individual Twin Assessments
                  <span className="ml-2 text-[12px] font-normal text-slate-400">
                    ({responses.length})
                  </span>
                </h3>
                <div className="space-y-3">
                  {responses.map((r, i) => (
                    <EmployeeCard
                      key={r.employee.id}
                      response={r}
                      onClick={() => setSelectedEmployee(r)}
                      index={i}
                    />
                  ))}
                </div>
                <div ref={responsesEndRef} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawers */}
      {selectedEmployee && (
        <DetailDrawer
          response={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
      {selectedTheme && (
        <ThemeDrawer
          theme={selectedTheme}
          responses={responses}
          onClose={() => setSelectedTheme(null)}
          onSelectEmployee={(r) => setSelectedEmployee(r)}
        />
      )}
    </div>
  );
}
