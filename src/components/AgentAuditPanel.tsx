"use client";

import { Shield, Cpu, Star, AlertTriangle, CheckCircle, Info } from "lucide-react";
import type { AgentAudit } from "@/types/audit";
import { MODEL_CATALOG } from "@/types/audit";
import { cn } from "@/lib/utils";

interface AgentAuditPanelProps {
  audit: AgentAudit | null;
  loading?: boolean;
  secureScore?: number | null;
  modelRecommendation?: string | null;
}

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 30;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
          <circle cx="40" cy="40" r="30" fill="none" stroke="#1e1e2e" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r="30"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-mono font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs text-[#8b8ba7] text-center">{label}</span>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 90) return "#60efff";
  if (score >= 80) return "#00d97e";
  if (score >= 65) return "#e8e8f0";
  if (score >= 50) return "#a78bfa";
  return "#ff4d4d";
}

export function AgentAuditPanel({
  audit,
  loading,
  secureScore,
  modelRecommendation,
}: AgentAuditPanelProps) {
  const totalScore = audit?.total_score ?? secureScore ?? null;
  const model = audit?.model_recommendation ?? modelRecommendation;
  const modelInfo = model ? MODEL_CATALOG[model] : null;

  return (
    <div className="rounded-xl border border-[#1e1e2e] bg-[#0e0e16] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-2">
        <Shield size={16} className="text-[#60efff]" />
        <span className="text-sm font-semibold text-[#f8f8ff]">Agent Security Audit</span>
        {loading && (
          <span className="ml-auto text-xs text-[#8b8ba7] animate-pulse">Running…</span>
        )}
        {audit?.status === "completed" && (
          <CheckCircle size={14} className="ml-auto text-[#00d97e]" />
        )}
      </div>

      {loading || !audit ? (
        <div className="p-6 text-center text-[#8b8ba7] text-sm">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#7c3aed] border-t-transparent animate-spin" />
              <span>Running 3 agents in parallel…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Info size={24} className="text-[#2e2e4e]" />
              <span>Audit pending submission</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4">
          {/* Score gauges */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <ScoreGauge
              score={audit.security_score ?? 0}
              label="Security"
              color={scoreColor(audit.security_score ?? 0)}
            />
            <ScoreGauge
              score={audit.quality_score ?? 0}
              label="Quality"
              color={scoreColor(audit.quality_score ?? 0)}
            />
            <ScoreGauge
              score={totalScore ?? 0}
              label="Overall"
              color={scoreColor(totalScore ?? 0)}
            />
          </div>

          {/* Model recommendation */}
          {modelInfo && (
            <div className="mb-4 p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
              <div className="flex items-center gap-2 mb-1">
                <Cpu size={13} className="text-[#60efff]" />
                <span className="text-xs font-semibold text-[#60efff]">Recommended Model</span>
              </div>
              <div className="text-sm font-semibold text-[#f8f8ff]">{modelInfo.name}</div>
              <div className="text-xs text-[#8b8ba7] mt-0.5">{modelInfo.description}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {modelInfo.strengths.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2 py-0.5 rounded-full bg-[#1e1e2e] text-[#8b8ba7]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Issues */}
          {audit.flagged_issues && audit.flagged_issues.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-[#8b8ba7] uppercase tracking-wider mb-2">
                <AlertTriangle size={12} />
                <span>Flagged Issues ({audit.flagged_issues.length})</span>
              </div>
              {audit.flagged_issues.map((issue, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-lg border text-xs",
                    issue.severity === "critical" && "bg-[#ff4d4d10] border-[#ff4d4d30] text-[#ff4d4d]",
                    issue.severity === "high" && "bg-[#ff8c0010] border-[#ff8c0030] text-[#ff8c00]",
                    issue.severity === "medium" && "bg-[#a78bfa10] border-[#a78bfa30] text-[#a78bfa]",
                    issue.severity === "low" && "bg-[#8b8ba710] border-[#8b8ba730] text-[#8b8ba7]"
                  )}
                >
                  <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                    <Star size={11} />
                    {issue.type}
                    <span className="ml-auto uppercase text-xs opacity-70">{issue.severity}</span>
                  </div>
                  <div className="opacity-80">{issue.description}</div>
                </div>
              ))}
            </div>
          )}

          {audit.flagged_issues?.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-[#00d97e] bg-[#00d97e0d] border border-[#00d97e20] rounded-lg p-3">
              <CheckCircle size={14} />
              <span>No security issues detected</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
