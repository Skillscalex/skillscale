export type AuditStatus = "pending" | "running" | "completed" | "failed";

export type IssueSeverity = "low" | "medium" | "high" | "critical";

export interface SecurityAuditResult {
  security_score: number;
  issues: SecurityIssue[];
  severity: IssueSeverity;
}

export interface SecurityIssue {
  type: string;
  description: string;
  severity: IssueSeverity;
  recommendation: string;
}

export interface ModelMatchResult {
  best_model: string;
  model_scores: Record<string, number>;
  reasoning: string;
}

export interface QualityCheckResult {
  quality_score: number;
  suggestions: string[];
  completeness: number;
}

export interface AgentAudit {
  id: string;
  skill_id: string;
  security_score: number | null;
  model_score: number | null;
  quality_score: number | null;
  total_score: number | null;
  flagged_issues: SecurityIssue[] | null;
  model_recommendation: string | null;
  audit_model: string;
  status: AuditStatus;
  security_result: SecurityAuditResult | null;
  model_result: ModelMatchResult | null;
  quality_result: QualityCheckResult | null;
  created_at: string;
}

export const MODEL_CATALOG: Record<string, { name: string; description: string; strengths: string[] }> = {
  "claude-opus-4-7": {
    name: "Claude Opus 4.7",
    description: "Most capable, best for complex reasoning and creative tasks",
    strengths: ["complex reasoning", "long context", "creative writing", "deep analysis"],
  },
  "claude-sonnet-4-6": {
    name: "Claude Sonnet 4.6",
    description: "Balanced performance and speed, ideal for most skills",
    strengths: ["coding", "analysis", "tool use", "balanced tasks"],
  },
  "claude-haiku-4-5": {
    name: "Claude Haiku 4.5",
    description: "Fast and efficient, perfect for simple, repetitive tasks",
    strengths: ["quick responses", "simple tasks", "high volume", "low latency"],
  },
};
