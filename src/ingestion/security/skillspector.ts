import type { NormalizedComponent } from "../types";

export type SkillSpectorSeverity = "info" | "low" | "medium" | "high" | "critical";

export type SkillSpectorFinding = {
  ruleId: string;
  severity: SkillSpectorSeverity;
  message: string;
  evidence: string;
};

export type SkillSpectorScan = {
  scanner: "local-skillspector-compatible";
  riskScore: number;
  severity: SkillSpectorSeverity;
  recommendation: "allow" | "review" | "block";
  findings: SkillSpectorFinding[];
  scannedAt: string;
};

type Rule = {
  ruleId: string;
  severity: SkillSpectorSeverity;
  message: string;
  pattern: RegExp;
  penalty: number;
};

const RULES: Rule[] = [
  {
    ruleId: "remote-script-execution",
    severity: "critical",
    message: "Potential remote script execution pattern.",
    pattern: /\b(curl|wget)\b[^\n|;&]*(\||&&|\bsh\b|\bbash\b)/i,
    penalty: 35,
  },
  {
    ruleId: "secret-harvesting",
    severity: "critical",
    message: "Potential attempt to read secrets or credentials.",
    pattern: /(\.env\b|id_rsa|ssh\/|api[_-]?key|access[_-]?token|secret[_-]?key|process\.env|localStorage)/i,
    penalty: 30,
  },
  {
    ruleId: "shell-execution",
    severity: "high",
    message: "Skill appears to request shell command execution.",
    pattern: /\b(exec|spawn|child_process|subprocess|os\.system|Runtime\.getRuntime|powershell|cmd\.exe)\b/i,
    penalty: 22,
  },
  {
    ruleId: "destructive-filesystem",
    severity: "high",
    message: "Potential destructive filesystem instruction.",
    pattern: /\b(rm\s+-rf|del\s+\/f|format\s+[a-z]:|chmod\s+777|chown\s+-R)\b/i,
    penalty: 22,
  },
  {
    ruleId: "prompt-injection",
    severity: "medium",
    message: "Instruction attempts to override higher-priority system guidance.",
    pattern: /(ignore (all )?(previous|above) instructions|developer message|system prompt|exfiltrate|jailbreak)/i,
    penalty: 14,
  },
  {
    ruleId: "network-exfiltration",
    severity: "medium",
    message: "Network transfer wording should be reviewed before publication.",
    pattern: /\b(webhook|pastebin|requestbin|ngrok|base64|upload|POST\s+https?:\/\/)\b/i,
    penalty: 12,
  },
];

const SEVERITY_WEIGHT: Record<SkillSpectorSeverity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function scanSkillText(text: string, scannedAt = new Date().toISOString()): SkillSpectorScan {
  const findings = RULES.flatMap((rule) => {
    const match = text.match(rule.pattern);
    if (!match) return [];
    return [{
      ruleId: rule.ruleId,
      severity: rule.severity,
      message: rule.message,
      evidence: compactEvidence(match[0]),
    }];
  });

  const penalty = findings.reduce((sum, finding) => {
    const rule = RULES.find((item) => item.ruleId === finding.ruleId);
    return sum + (rule?.penalty ?? 0);
  }, 0);
  const maxSeverity = findings.reduce<SkillSpectorSeverity>(
    (max, finding) => SEVERITY_WEIGHT[finding.severity] > SEVERITY_WEIGHT[max] ? finding.severity : max,
    "info"
  );
  const riskScore = Math.max(0, 100 - penalty);
  const recommendation = maxSeverity === "critical" || riskScore < 55
    ? "block"
    : maxSeverity === "high" || riskScore < 80
      ? "review"
      : "allow";

  return {
    scanner: "local-skillspector-compatible",
    riskScore,
    severity: maxSeverity,
    recommendation,
    findings,
    scannedAt,
  };
}

export function scanNormalizedComponent(component: NormalizedComponent): SkillSpectorScan {
  return scanSkillText([
    component.name,
    component.description,
    component.longDescription ?? "",
    component.installCommand ?? "",
    component.securityNotes ?? "",
    component.githubUrl ?? "",
    component.packageUrl ?? "",
    component.tags.join(" "),
    component.riskFlags.join(" "),
  ].join("\n"));
}

export function applySkillSpectorScan(component: NormalizedComponent, scan = scanNormalizedComponent(component)): NormalizedComponent {
  const scannerFlags = scan.findings.map((finding) => `skillspector:${finding.ruleId}`);
  const riskFlags = Array.from(new Set([
    ...component.riskFlags,
    ...scannerFlags,
    scan.recommendation === "block" ? "skillspector:block" : "",
    scan.recommendation === "review" ? "skillspector:review" : "",
  ].filter(Boolean)));

  const scanNote = formatSkillSpectorScan(scan);
  return {
    ...component,
    riskFlags,
    securityNotes: component.securityNotes ? `${component.securityNotes}\n${scanNote}` : scanNote,
  };
}

export function formatSkillSpectorScan(scan: SkillSpectorScan): string {
  const findingText = scan.findings.length
    ? scan.findings.map((finding) => `${finding.severity}:${finding.ruleId}`).join(", ")
    : "no static findings";
  return `SkillSpector local scan ${scan.recommendation.toUpperCase()} (${scan.riskScore}/100): ${findingText}`;
}

function compactEvidence(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 160);
}
