"use client";

import { useState, useCallback } from "react";
import { Zap, Clock, DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react";

// Pricing per 1M tokens (USD) — Anthropic list prices as of mid-2025
const MODEL_PRICING = {
  "claude-opus-4-5":   { input: 15.00, output: 75.00, label: "Opus 4.5" },
  "claude-sonnet-4-5": { input:  3.00, output: 15.00, label: "Sonnet 4.5" },
  "claude-haiku-4-5":  { input:  0.25, output:  1.25, label: "Haiku 4.5" },
} as const;

type ModelId = keyof typeof MODEL_PRICING;

// Agent roster — matches AGENTS.md
const AGENTS = [
  { id: "orchestrator", name: "Orchestrator", model: "claude-opus-4-5"   as ModelId, avgInputK: 8,  avgOutputK: 4,  timeS: 12 },
  { id: "researcher",   name: "Researcher",   model: "claude-sonnet-4-5" as ModelId, avgInputK: 6,  avgOutputK: 3,  timeS: 8  },
  { id: "designer",     name: "Designer",     model: "claude-sonnet-4-5" as ModelId, avgInputK: 5,  avgOutputK: 4,  timeS: 7  },
  { id: "engineer",     name: "Engineer",     model: "claude-sonnet-4-5" as ModelId, avgInputK: 7,  avgOutputK: 5,  timeS: 9  },
  { id: "coder",        name: "Coder",        model: "claude-haiku-4-5"  as ModelId, avgInputK: 4,  avgOutputK: 8,  timeS: 5  },
  { id: "debugger",     name: "Debugger",     model: "claude-sonnet-4-5" as ModelId, avgInputK: 5,  avgOutputK: 3,  timeS: 6  },
  { id: "validator",    name: "Validator",    model: "claude-sonnet-4-5" as ModelId, avgInputK: 4,  avgOutputK: 2,  timeS: 5  },
  { id: "reflector",    name: "Reflector",    model: "claude-opus-4-5"   as ModelId, avgInputK: 6,  avgOutputK: 3,  timeS: 10 },
] as const;

const LOOP_PHASES = [
  "search_and_learn","brainstorm","design","critique",
  "engineer","code","debug","validate","reflect","iterate",
];

function formatCost(usd: number) {
  if (usd < 0.01) return `$${(usd * 100).toFixed(3)}¢`;
  return `$${usd.toFixed(4)}`;
}
function formatTime(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

interface EstimateResult {
  totalCost: number;
  totalTimeS: number;
  perAgent: { name: string; cost: number; timeS: number; model: string }[];
  usageWarning: string | null;
}

function estimate(iterations: number, selectedAgents: Set<string>): EstimateResult {
  const perAgent: EstimateResult["perAgent"] = [];
  let totalCost = 0;
  let parallelTimeS = 0; // agents run in parallel per phase

  for (const agent of AGENTS) {
    if (!selectedAgents.has(agent.id)) continue;
    const pricing = MODEL_PRICING[agent.model];
    const inputCost  = (agent.avgInputK  / 1000) * pricing.input  * iterations;
    const outputCost = (agent.avgOutputK / 1000) * pricing.output * iterations;
    const cost = inputCost + outputCost;
    totalCost += cost;
    const agentTimeS = agent.timeS * iterations;
    parallelTimeS = Math.max(parallelTimeS, agentTimeS); // parallel bottleneck
    perAgent.push({ name: agent.name, cost, timeS: agentTimeS, model: MODEL_PRICING[agent.model].label });
  }

  // Add sequential loop overhead: 10 phases × iterations
  const totalTimeS = parallelTimeS + LOOP_PHASES.length * 0.5 * iterations;

  // Usage warning thresholds
  let usageWarning: string | null = null;
  if (totalCost > 5)   usageWarning = "High cost — consider using Haiku-only agents for bulk phases.";
  if (totalCost > 20)  usageWarning = "⚠️ Very high cost! Enable /usage-credits and review plan before running.";
  if (iterations > 50) usageWarning = "Large iteration count — ensure ANTHROPIC_API rate limits won\'t throttle.";

  return { totalCost, totalTimeS, perAgent, usageWarning };
}

export default function AgentCostEstimator() {
  const [iterations, setIterations] = useState(3);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(
    new Set(AGENTS.map((a) => a.id))
  );
  const [showDetail, setShowDetail] = useState(false);

  const toggleAgent = useCallback((id: string) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const result = estimate(iterations, selectedAgents);

  return (
    <div className="agent-widget" aria-label="AgentOS Cost & Time Estimator">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={20} className="text-[var(--accent)]" aria-hidden />
        <h3 className="font-bold text-[var(--text-primary)] text-lg">
          AgentOS Estimator
        </h3>
        <span className="ml-auto text-xs bg-[var(--accent-light)] text-[var(--accent)] px-2 py-0.5 rounded-full font-semibold">
          Plan Mode
        </span>
      </div>

      {/* Iterations slider */}
      <label className="block mb-1 text-sm font-medium text-[var(--text-secondary)]">
        Loop iterations: <span className="font-bold text-[var(--accent)]">{iterations}</span>
      </label>
      <input
        type="range" min={1} max={100} value={iterations}
        onChange={(e) => setIterations(Number(e.target.value))}
        className="w-full accent-[var(--accent)] mb-4"
        aria-label="Number of loop iterations"
      />

      {/* Agent toggles */}
      <p className="text-xs text-[var(--text-muted)] mb-2 font-medium uppercase tracking-wide">
        Active Agents ({selectedAgents.size}/{AGENTS.length})
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {AGENTS.map((agent) => {
          const on = selectedAgents.has(agent.id);
          return (
            <button
              key={agent.id}
              onClick={() => toggleAgent(agent.id)}
              aria-pressed={on}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                on
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border)]"
              }`}
            >
              {agent.name}
            </button>
          );
        })}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="stat-card">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign size={14} className="text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-muted)]">Est. Cost</span>
          </div>
          <div className="stat-value text-xl">{formatCost(result.totalCost)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock size={14} className="text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-muted)]">Est. Time</span>
          </div>
          <div className="stat-value text-xl">{formatTime(result.totalTimeS)}</div>
        </div>
        <div className="stat-card col-span-2 sm:col-span-1">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users size={14} className="text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-muted)]">Agents</span>
          </div>
          <div className="stat-value text-xl">{selectedAgents.size}</div>
        </div>
      </div>

      {/* Progress bar visual */}
      <div className="agent-progress mb-4" aria-hidden>
        <div
          className="agent-progress-fill"
          style={{ width: `${Math.min((iterations / 100) * 100, 100)}%` }}
        />
      </div>

      {/* Warning */}
      {result.usageWarning && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[#d6f4f7] border border-[#00B0BA40] text-[#065279] text-xs mb-4">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{result.usageWarning}</span>
        </div>
      )}

      {/* Detail toggle */}
      <button
        onClick={() => setShowDetail((v) => !v)}
        className="flex items-center gap-1 text-xs text-[var(--accent)] font-medium"
      >
        <TrendingUp size={12} />
        {showDetail ? "Hide" : "Show"} per-agent breakdown
      </button>

      {showDetail && (
        <div className="mt-3 space-y-2">
          {result.perAgent.map((a) => (
            <div
              key={a.name}
              className="flex items-center justify-between text-xs p-2 rounded-lg bg-[var(--bg-muted)]"
            >
              <span className="font-medium text-[var(--text-primary)] w-24">{a.name}</span>
              <span className="text-[var(--text-muted)] text-[10px]">{a.model}</span>
              <span className="font-mono text-[var(--accent)]">{formatCost(a.cost)}</span>
              <span className="font-mono text-[var(--text-secondary)]">{formatTime(a.timeS)}</span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[10px] text-[var(--text-muted)] leading-relaxed">
        Estimates based on average token counts per agent call × iterations.
        Actual usage depends on task complexity. Enable{" "}
        <code className="font-mono">/usage-credits</code> in Claude Code to track live spend.
      </p>
    </div>
  );
}
