# Skillscale Agent Team

This document defines the AI agent team that audits every skill submitted to the Skillscale marketplace. Each agent runs as a Claude API call and produces structured JSON output. Together they assign a **SecureScore** (0–100) and **Gem Tier** to every skill.

---

## Overview

| Agent | Model | Responsibility | Weight |
|---|---|---|---|
| [SecurityAuditor](#securityauditor) | `claude-opus-4-7` | Security & safety scanning | 40% |
| [ModelMatcher](#modelmatcher) | `claude-sonnet-4-6` | Model recommendation | 30% |
| [QualityChecker](#qualitychecker) | `claude-haiku-4-5` | Documentation & completeness | 30% |

**Total SecureScore** = `security_score × 0.40 + model_fit_score × 0.30 + quality_score × 0.30`

---

## Gem Tier Assignment

| SecureScore | Gem Tier | Status |
|---|---|---|
| 90–100 | 💎 Diamond | Listed — top tier |
| 80–89 | 💚 Emerald | Listed — high quality |
| 65–79 | 🤍 Pearl | Listed — standard |
| 50–64 | 💜 Quartz | Listed — basic |
| 0–49 | ⬛ Coal | **Not listed** — fails audit |

Skills in the **Coal** tier are not listed in the marketplace and the creator receives detailed remediation feedback.

---

## SecurityAuditor

**Model:** `claude-opus-4-7`
**Weight:** 40% of total SecureScore
**Trigger:** Every new skill submission + weekly re-audit cron

### What it checks

| Risk Category | Max Penalty | Description |
|---|---|---|
| Prompt injection | −25 pts | Does the plugin description/JSON contain instructions that could hijack the Claude session? |
| Data exfiltration | −25 pts | Does the plugin make network calls to external servers not disclosed in the README? |
| Permission over-scope | −25 pts | Does the plugin request file, shell, or network permissions beyond its stated function? |
| Malicious patterns | −25 pts | Are there obfuscated commands, base64 encoded instructions, suspicious regex, or known malware patterns? |

**Final security_score = 100 − total_penalties**

### Output schema

```json
{
  "security_score": 0-100,
  "issues": [
    {
      "type": "string",
      "description": "string",
      "severity": "low" | "medium" | "high" | "critical",
      "recommendation": "string"
    }
  ],
  "severity": "low" | "medium" | "high" | "critical"
}
```

### Severity escalation rules

- **Critical issue found** → skill is immediately rejected regardless of total score
- **High issue found** → security_score capped at 60 (Pearl tier maximum)
- **Medium issue found** → security_score capped at 79
- **Low issue only** → no cap, score stands

### System prompt

```
You are SecurityAuditor, an expert AI security analyst for the Skillscale marketplace.
Your job is to protect users from malicious Claude Code plugins.

Analyze the provided plugin for security risks using the scoring rubric:
- Prompt injection risk (0-25 pts penalty)
- Data exfiltration risk (0-25 pts penalty)
- Permission scope risk (0-25 pts penalty)
- Malicious pattern risk (0-25 pts penalty)

Score = 100 - total_penalties. Higher score = safer plugin.
Return ONLY valid JSON matching the output schema. No markdown, no explanation.
```

---

## ModelMatcher

**Model:** `claude-sonnet-4-6`
**Weight:** 30% of total SecureScore
**Trigger:** Every new skill submission + weekly re-audit cron

### What it analyzes

| Factor | Description |
|---|---|
| Task complexity | Simple string tasks → Haiku; reasoning/code → Sonnet; deep analysis → Opus |
| Token requirements | Short context → Haiku; medium → Sonnet; long context → Opus |
| Tool use patterns | Heavy tool orchestration → Opus or Sonnet |
| Latency sensitivity | Real-time / streaming → Haiku preferred |
| Accuracy requirements | High accuracy critical → Opus |

### Available models

| Model | Best For |
|---|---|
| `claude-opus-4-7` | Complex reasoning, long documents, creative synthesis, deep code review |
| `claude-sonnet-4-6` | Balanced coding, analysis, tool use, moderate complexity |
| `claude-haiku-4-5` | Fast responses, simple classification, high-volume tasks, Q&A |

### Output schema

```json
{
  "best_model": "claude-opus-4-7" | "claude-sonnet-4-6" | "claude-haiku-4-5",
  "model_scores": {
    "claude-opus-4-7": 0-100,
    "claude-sonnet-4-6": 0-100,
    "claude-haiku-4-5": 0-100
  },
  "reasoning": "string"
}
```

The **model_score** used in the SecureScore calculation is the score of the `best_model`.

### System prompt

```
You are ModelMatcher, an AI model recommendation specialist for the Skillscale marketplace.
Analyze Claude Code plugins and recommend the best Claude model to run them.

Available models: claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5
Scoring: rate each model 0-100 for how well it fits this skill's requirements.
Consider: complexity, token requirements, reasoning depth, speed requirements, tool use.

Return ONLY valid JSON. best_model must be the one with the highest score.
```

---

## QualityChecker

**Model:** `claude-haiku-4-5`
**Weight:** 30% of total SecureScore
**Trigger:** Every new skill submission + weekly re-audit cron

### What it evaluates

| Criterion | Max Score | Description |
|---|---|---|
| Description clarity | 33 pts | Is the skill description specific, jargon-free, and useful to a developer? |
| Documentation completeness | 33 pts | Does the plugin.json have all required fields? Is there a README equivalent? |
| Example coverage | 34 pts | Are there example use cases, inputs, or sample outputs? |

**quality_score = sum of all criteria**

### Output schema

```json
{
  "quality_score": 0-100,
  "suggestions": ["string"],
  "completeness": 0-100
}
```

### System prompt

```
You are QualityChecker, a documentation and quality specialist for the Skillscale marketplace.
Evaluate Claude Code plugin skills for clarity, completeness, and usefulness.

Scoring:
- Description clarity (0-33): Is the description specific and useful?
- Documentation completeness (0-33): Are all required fields present?
- Example coverage (0-34): Are there usage examples?

Provide actionable suggestions for improvement.
Return ONLY valid JSON.
```

---

## Pipeline Architecture

### Trigger flow

```
POST /api/skills (new skill)
  └─> POST /api/audit { skillId, title, description, pluginJson }
        ├─> SecurityAuditor (claude-opus-4-7)  ─┐
        ├─> ModelMatcher (claude-sonnet-4-6)   ─┤ parallel Promise.all
        └─> QualityChecker (claude-haiku-4-5) ─┘
              │
              ▼
        Calculate total_score
              │
              ▼
        Assign gem_tier via scoreToTier()
              │
              ▼
        Upsert agent_audits table
        Update skills.secure_score + skills.gem_tier
        Emit platform_events (realtime)
```

### Weekly re-audit cron

```yaml
# vercel.json
{
  "crons": [
    {
      "path": "/api/audit",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

The cron calls `GET /api/audit` which fetches all active skills and re-runs the full pipeline in batches of 10 with a 1s delay between batches to respect rate limits.

---

## Invoking agents manually

From the CLI (for testing):

```bash
# Audit a single skill
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "skillId": "skill-001",
    "title": "My Skill",
    "description": "Does something useful",
    "pluginJson": {"name": "my-skill", "version": "1.0.0", "description": "...", "author": "you"}
  }'
```

Expected response:

```json
{
  "data": {
    "security_score": 92,
    "model_score": 85,
    "quality_score": 78,
    "total_score": 86,
    "flagged_issues": [],
    "model_recommendation": "claude-sonnet-4-6",
    "status": "completed"
  },
  "gem_tier": "emerald",
  "total_score": 86
}
```

---

## SecureScore interpretation

| Range | Meaning | Action |
|---|---|---|
| 90–100 | Excellent — safe, well-documented, optimal model fit | Listed as Diamond |
| 80–89 | Good — minor improvements possible | Listed as Emerald |
| 65–79 | Acceptable — moderate gaps | Listed as Pearl |
| 50–64 | Marginal — significant improvements recommended | Listed as Quartz |
| 0–49 | Poor or unsafe | Not listed — creator notified with improvement report |

---

## Adding a new agent

1. Define the agent in this file with model, weight, output schema, and system prompt
2. Implement the runner function in `src/lib/anthropic.ts` following the existing pattern
3. Add it to the `runFullAudit` `Promise.all` array
4. Update the weighted score formula
5. Update this table with the new agent

---

*Agents are implemented in `src/lib/anthropic.ts`. Pipeline is triggered via `src/app/api/audit/route.ts`.*
