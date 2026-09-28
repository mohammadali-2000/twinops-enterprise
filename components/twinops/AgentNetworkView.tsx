"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Play, Radio } from "lucide-react";

// ============================================
// Types
// ============================================

interface AgentNode {
  id: string;
  name: string;
  role: string;
  color: string;
  x: number;
  y: number;
}

interface AgentMessage {
  id: string;
  fromId: string;
  toId: string;
  type: "task" | "data" | "status" | "query" | "response" | "approval";
  content: string;
  timestamp: number;
}

interface Particle {
  id: string;
  fromId: string;
  toId: string;
  color: string;
  duration: number;
}

// ============================================
// Constants
// ============================================

const EVENT_TYPE_STYLES: Record<string, { color: string; label: string }> = {
  task: { color: "#2563eb", label: "TASK" },
  data: { color: "#059669", label: "DATA" },
  status: { color: "#d97706", label: "STATUS" },
  query: { color: "#4f46e5", label: "QUERY" },
  response: { color: "#7c3aed", label: "RESPONSE" },
  approval: { color: "#db2777", label: "COMPLETE" },
};

const DEFAULT_AGENTS: AgentNode[] = [
  { id: "orchestrator", name: "TwinOps Lead", role: "Pod Orchestrator", color: "#4f46e5", x: 300, y: 50 },
  { id: "research", name: "Knowledge Mesh", role: "Vector & Graph Index", color: "#2563eb", x: 120, y: 160 },
  { id: "aggregator", name: "Consensus Engine", role: "Stance Synthesis", color: "#7c3aed", x: 480, y: 160 },
  { id: "clone_1", name: "Architecture Twin", role: "Systems Architect", color: "#059669", x: 60, y: 300 },
  { id: "clone_2", name: "Security Twin", role: "SecOps & Compliance", color: "#d97706", x: 210, y: 316 },
  { id: "clone_3", name: "Data Twin", role: "Data Platforms", color: "#db2777", x: 360, y: 300 },
  { id: "clone_4", name: "DevOps Twin", role: "Cloud & Infrastructure", color: "#0284c7", x: 510, y: 316 },
];

const DEFAULT_EDGES: [string, string][] = [
  ["orchestrator", "research"],
  ["orchestrator", "aggregator"],
  ["research", "clone_1"],
  ["research", "clone_2"],
  ["research", "clone_3"],
  ["research", "clone_4"],
  ["research", "aggregator"],
];

const SIMULATION_SEQUENCE: Omit<AgentMessage, "id" | "timestamp">[] = [
  { fromId: "orchestrator", toId: "research", type: "task", content: "Query active twins for consensus on enterprise architectural readiness" },
  { fromId: "research", toId: "clone_1", type: "query", content: "Architecture Twin: verify cross-service API boundaries and database schema integrity" },
  { fromId: "clone_1", toId: "research", type: "response", content: "Relational schema, pgvector indexes, and API contracts verified aligned" },
  { fromId: "research", toId: "clone_2", type: "query", content: "Security Twin: verify zero secrets committed and credential boundaries enforced" },
  { fromId: "clone_2", toId: "research", type: "response", content: "Audit completed: zero exposed tokens, strict environment isolation validated" },
  { fromId: "research", toId: "clone_3", type: "query", content: "Data Twin: confirm knowledge ingestion pipeline and vector similarity metrics" },
  { fromId: "clone_3", toId: "research", type: "response", content: "pgvector similarity pipeline indexed with durable memory compaction enabled" },
  { fromId: "research", toId: "clone_4", type: "query", content: "DevOps Twin: check CI/CD pipeline health and containerization readiness" },
  { fromId: "clone_4", toId: "research", type: "response", content: "Clean build passes, health checks responsive, deployment manifest verified" },
  { fromId: "research", toId: "aggregator", type: "data", content: "Aggregated consensus inputs from all domain twins for executive summary" },
  { fromId: "aggregator", toId: "orchestrator", type: "status", content: "Consensus evaluation: 100% agreement, zero blocking architectural risks" },
  { fromId: "aggregator", toId: "orchestrator", type: "approval", content: "Enterprise release verification approved across all operational twins" },
];

function getEdgePath(from: AgentNode, to: AgentNode, curvature = 0.15): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return `M ${from.x},${from.y} L ${to.x},${to.y}`;
  const nx = -dy / len;
  const ny = dx / len;
  const offset = len * curvature;
  const cx = (from.x + to.x) / 2 + nx * offset;
  const cy = (from.y + to.y) / 2 + ny * offset;
  return `M ${from.x},${from.y} Q ${cx},${cy} ${to.x},${to.y}`;
}

function getAnimationPath(from: AgentNode, to: AgentNode, curvature = 0.15): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return `M 0,0 L 0,0`;
  const nx = -dy / len;
  const ny = dx / len;
  const offset = len * curvature;
  const cx = dx / 2 + nx * offset;
  const cy = dy / 2 + ny * offset;
  return `M 0,0 Q ${cx},${cy} ${dx},${dy}`;
}

function getEdgeKey(fromId: string, toId: string): string {
  return `${fromId}->${toId}`;
}

let _particleId = 0;
function nextParticleId(): string {
  return `p_${++_particleId}_${Date.now()}`;
}

// ============================================
// Component
// ============================================

interface AgentNetworkViewProps {
  agents?: AgentNode[];
  compact?: boolean;
  trigger?: number;
}

export function AgentNetworkView({
  agents = DEFAULT_AGENTS,
  compact = false,
  trigger = 0,
}: AgentNetworkViewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [events, setEvents] = useState<AgentMessage[]>([]);
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set());
  const [particles, setParticles] = useState<Particle[]>([]);
  const [progress, setProgress] = useState(0);

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const agentMap = useMemo(() => {
    const map = new Map<string, AgentNode>();
    agents.forEach((a) => map.set(a.id, a));
    return map;
  }, [agents]);

  const runSimulation = useCallback(() => {
    clearAllTimers();
    setEvents([]);
    setActiveNodes(new Set());
    setActiveEdges(new Set());
    setParticles([]);
    setIsRunning(true);
    setProgress(0);

    const stepDelay = 900;
    const particleDuration = 700;
    const totalSteps = SIMULATION_SEQUENCE.length;

    SIMULATION_SEQUENCE.forEach((msg, idx) => {
      const startTime = idx * stepDelay;

      const t1 = setTimeout(() => {
        const fromNode = agentMap.get(msg.fromId);
        const style = EVENT_TYPE_STYLES[msg.type] || EVENT_TYPE_STYLES.status;

        setActiveNodes((prev) => new Set([...prev, msg.fromId]));
        setActiveEdges((prev) => new Set([...prev, getEdgeKey(msg.fromId, msg.toId)]));

        const pId = nextParticleId();
        setParticles((prev) => [
          ...prev,
          {
            id: pId,
            fromId: msg.fromId,
            toId: msg.toId,
            color: style.color || fromNode?.color || "#4f46e5",
            duration: particleDuration,
          },
        ]);

        const fullMsg: AgentMessage = {
          ...msg,
          id: `msg_${idx}_${Date.now()}`,
          timestamp: Date.now(),
        };
        setEvents((prev) => [...prev, fullMsg]);
        setProgress(Math.round(((idx + 1) / totalSteps) * 100));

        const tParticle = setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== pId));
          setActiveNodes((prev) => new Set([...prev, msg.toId]));
        }, particleDuration);
        timersRef.current.push(tParticle);

        const tFade = setTimeout(() => {
          setActiveEdges((prev) => {
            const next = new Set(prev);
            next.delete(getEdgeKey(msg.fromId, msg.toId));
            return next;
          });
        }, particleDuration + 400);
        timersRef.current.push(tFade);
      }, startTime);

      timersRef.current.push(t1);
    });

    const totalDuration = totalSteps * stepDelay + 1000;
    const tEnd = setTimeout(() => {
      setIsRunning(false);
      setActiveNodes(new Set());
      setActiveEdges(new Set());
    }, totalDuration);
    timersRef.current.push(tEnd);
  }, [clearAllTimers, agentMap]);

  useEffect(() => {
    if (trigger > 0) {
      runSimulation();
    }
  }, [trigger, runSimulation]);

  const svgWidth = 620;
  const svgHeight = compact ? 300 : 380;

  return (
    <div
      className={`flex ${
        compact ? "flex-col" : "flex-row"
      } gap-0 rounded-3xl border border-[#e2eaf3] bg-[#f1f5fa] shadow-[6px_6px_14px_#cfd8e5,-6px_-6px_14px_#ffffff] overflow-hidden`}
    >
      {/* Topology Panel */}
      <div
        className={`relative ${compact ? "w-full" : "flex-1"} bg-[#eaf0f6]`}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[#d8e2ed] bg-[#f1f5fa] px-5 py-3">
          <div className="flex items-center gap-2">
            <Radio
              size={14}
              className={
                isRunning
                  ? "text-emerald-600 animate-pulse"
                  : "text-slate-400"
              }
            />
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
              Twin Mesh Topology
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isRunning && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                Synchronizing
              </span>
            )}
            <button
              onClick={runSimulation}
              disabled={isRunning}
              className="flex items-center gap-1.5 rounded-xl border border-[#e2eaf3] bg-[#f1f5fa] px-3 py-1.5 text-[11.5px] font-bold text-slate-700 shadow-[2px_2px_5px_#cfd8e5,-2px_-2px_5px_#ffffff] transition-all hover:text-indigo-600 hover:shadow-[inset_1px_1px_3px_#cfd8e5] disabled:opacity-40"
            >
              <Play size={11} />
              Simulate Mesh Flow
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {isRunning && (
          <div className="h-[3px] w-full bg-slate-200">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* SVG Graph */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full"
          style={{ minHeight: compact ? 240 : 300 }}
        >
          <defs>
            <pattern
              id="agentDotGrid"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="12"
                cy="12"
                r="1"
                fill="#94a3b8"
                opacity="0.3"
              />
            </pattern>
            <filter
              id="agentGlow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
            </filter>
          </defs>

          <rect
            width={svgWidth}
            height={svgHeight}
            fill="url(#agentDotGrid)"
          />

          {/* Edges */}
          {DEFAULT_EDGES.map(([fromId, toId]) => {
            const from = agentMap.get(fromId);
            const to = agentMap.get(toId);
            if (!from || !to) return null;
            const key = getEdgeKey(fromId, toId);
            const active = activeEdges.has(key);
            const path = getEdgePath(from, to);

            return (
              <g key={key}>
                {active && (
                  <path
                    d={path}
                    fill="none"
                    stroke={from.color}
                    strokeWidth={4}
                    opacity={0.3}
                    filter="url(#agentGlow)"
                  />
                )}
                <path
                  d={path}
                  fill="none"
                  stroke={active ? "#4f46e5" : "#cbd5e1"}
                  strokeWidth={active ? 2 : 1}
                  opacity={active ? 1 : 0.6}
                  strokeDasharray={active ? "none" : "4 3"}
                  style={{ transition: "all 0.3s ease" }}
                />
              </g>
            );
          })}

          {/* Particles */}
          {particles.map((p) => {
            const from = agentMap.get(p.fromId);
            const to = agentMap.get(p.toId);
            if (!from || !to) return null;
            const animPath = getAnimationPath(from, to);

            return (
              <g
                key={p.id}
                transform={`translate(${from.x},${from.y})`}
              >
                <circle r={8} fill={p.color} opacity={0.25}>
                  <animateMotion
                    dur={`${p.duration}ms`}
                    path={animPath}
                    fill="freeze"
                  />
                </circle>
                <circle r={4} fill={p.color} opacity={0.9}>
                  <animateMotion
                    dur={`${p.duration}ms`}
                    path={animPath}
                    fill="freeze"
                  />
                </circle>
              </g>
            );
          })}

          {/* Nodes */}
          {agents.map((node) => {
            const active = activeNodes.has(node.id);
            return (
              <g key={node.id}>
                {active && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={26}
                    fill={node.color}
                    opacity={0.2}
                    filter="url(#agentGlow)"
                  />
                )}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={18}
                  fill="#ffffff"
                  stroke={active ? node.color : "#cbd5e1"}
                  strokeWidth={active ? 2.5 : 1.5}
                  style={{ transition: "all 0.3s ease" }}
                />
                <text
                  x={node.x}
                  y={node.y + 4.5}
                  textAnchor="middle"
                  fill={node.color}
                  fontSize="10"
                  fontWeight="bold"
                >
                  {node.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </text>
                <text
                  x={node.x}
                  y={node.y + 32}
                  textAnchor="middle"
                  fill="#1e293b"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {node.name}
                </text>
                <text
                  x={node.x}
                  y={node.y + 44}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8.5"
                  fontWeight="bold"
                  letterSpacing="0.05em"
                >
                  {node.role.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Event Stream Panel */}
      <div
        className={`${
          compact ? "w-full border-t" : "w-[300px] border-l"
        } border-[#d8e2ed] flex flex-col bg-[#f1f5fa]`}
      >
        <div className="flex items-center justify-between border-b border-[#d8e2ed] px-4 py-3 bg-white">
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-700">
            Event Stream
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            {events.length} Events
          </span>
        </div>

        <div
          ref={feedRef}
          className="flex-1 overflow-y-auto p-3 space-y-2"
          style={{ maxHeight: compact ? 200 : svgHeight + 30 }}
        >
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Radio size={20} className="mb-2 text-slate-300" />
              <p className="text-[12px] font-medium text-slate-400">
                Waiting for pod activity…
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((evt) => {
                const from = agentMap.get(evt.fromId);
                const to = agentMap.get(evt.toId);
                const style =
                  EVENT_TYPE_STYLES[evt.type] ||
                  EVENT_TYPE_STYLES.status;

                return (
                  <div
                    key={evt.id}
                    className="animate-fade-in-up rounded-xl border border-[#e2eaf3] bg-white p-3 shadow-[2px_2px_5px_#cfd8e5]"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          color: style.color,
                          backgroundColor: `${style.color}15`,
                        }}
                      >
                        {style.label}
                      </span>
                      <span className="text-[9px] font-medium text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold">
                      <span style={{ color: from?.color || "#4f46e5" }}>
                        {from?.name || evt.fromId}
                      </span>
                      <span className="text-slate-300">→</span>
                      <span style={{ color: to?.color || "#4f46e5" }}>
                        {to?.name || evt.toId}
                      </span>
                    </div>
                    <p className="text-[11.5px] font-medium leading-relaxed text-slate-600">
                      {evt.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
