# Skillscale Agents

This file documents the agent systems used by Skillscale: the audit/orchestration agents in the Next.js app, the live Studio agents behind the WebSocket server, and the autonomous catalog agents that keep the static and Supabase-backed skill catalog current.

## Agent Surfaces

| Surface | Implementation | Trigger |
|---|---|---|
| Skill audit | `src/lib/anthropic.ts`, `src/app/api/audit/route.ts` | Skill submission or API audit request |
| Studio chat | `src/app/studio/page.tsx`, `src/app/api/studio/**` | User messages in Studio |
| Live WebSocket agents | `src/agents/server.ts` | `ws://localhost:3001` or production WSS |
| Autonomous catalog | `src/ingestion/autonomous/**` | Ingestion scripts and GitHub workflows |
| Static Pages catalog | `docs/skills.html`, `docs/data/**` | GitHub Pages browsing and fallback data |

## Audit Agent Roster

Every submitted skill can be scored by a weighted audit pipeline.

| Agent | Model | Weight | Role |
|---|---|---:|---|
| SecurityAuditor | `claude-opus-4-7` | 0.40 | Security scanning, unsafe behavior, dependency and prompt-risk review |
| ModelMatcher | `claude-sonnet-4-6` | 0.30 | Recommends compatible model/runtime surfaces |
| QualityChecker | `claude-haiku-4-5` | 0.30 | Documentation, examples, installability, maintainability |

Gem tiers are derived from the final SecureScore:

| Tier | Score | Meaning |
|---|---:|---|
| Diamond / Legendary | 90-100 | Excellent |
| Emerald / Epic | 80-89 | Strong |
| Pearl / Rare | 65-79 | Acceptable |
| Quartz / Standard | 50-64 | Needs improvement |
| Coal / Draft | 0-49 | Not marketplace-ready |

## Autonomous Catalog Loop

The catalog loop discovers, normalizes, audits, deduplicates, publishes, and reflects on skill entries.

```text
search_and_learn
  -> normalize
  -> dedupe
  -> security_scan
  -> score
  -> publish_static_catalog
  -> mirror_to_supabase
  -> validate
  -> reflect
  -> iterate
```

Relevant files:

| File | Purpose |
|---|---|
| `src/ingestion/autonomous/loop.ts` | Main autonomous skill loop |
| `src/ingestion/autonomous/pagesCatalog.ts` | Builds GitHub Pages catalog data |
| `src/ingestion/autonomous/skillShards.ts` | Publishes paginated static shards |
| `src/ingestion/autonomous/occupationCounts.ts` | Builds occupation totals and coverage |
| `src/ingestion/autonomous/mirrorQueue.ts` | Tracks missing mirror shards |
| `src/ingestion/security/skillspector.ts` | SkillSpector-compatible security checks |

## Live Studio Agent Roster

These agents are long-lived processes connected to Studio through WebSocket. The current `src/agents/server.ts` is a reachable health/streaming scaffold that emits progress and token events; provider-specific production capabilities are enabled by environment keys and future agent modules.

| Agent | Transport | Runtime | Capabilities |
|---|---|---|---|
| VideoAgent | WebSocket | DigitalOcean / Railway / Render | Script generation, staged video progress, future TTS/ffmpeg/R2 assembly |
| ContentAgent | WebSocket | Railway / Render | Blog posts, social copy, emails, skill descriptions |
| ResearchAgent | WebSocket | Render | Web research, source synthesis, market and demand analysis |
| SkillCoachAgent | WebSocket | Railway | Skill gap analysis, learning plans, coaching sessions |

## VideoAgent

VideoAgent is designed for faceless short-form or YouTube-style videos from a single topic.

Pipeline:

```text
topic
  -> ResearchAgent facts/hooks
  -> structured script scenes
  -> ElevenLabs voiceover
  -> Pexels or generated visuals
  -> subtitle timing
  -> ffmpeg assembly
  -> Cloudflare R2 upload
  -> CDN URL
```

Input:

```typescript
type VideoJobInput = {
  topic: string;
  duration: 30 | 60 | 90 | 180;
  voice: "nova" | "echo" | "fable" | "onyx" | "shimmer";
  style: "educational" | "motivational" | "storytelling" | "listicle";
  music: "upbeat" | "ambient" | "cinematic" | "none";
  subtitles: boolean;
  resolution: "1080p" | "720p" | "9:16";
};
```

Progress event:

```typescript
type VideoProgressEvent = {
  jobId: string;
  stage: "researching" | "scripting" | "tts" | "visuals" | "assembly" | "uploading" | "done";
  progress: number;
  message: string;
  url?: string;
};
```

System prompt:

```text
You are VideoAgent, a professional faceless video content creator.
Given a topic, produce a complete video script as structured JSON.
Each scene has: duration, narration, b_roll_query, and optional overlay_text.
Make content engaging, educational, and optimized for retention.
Never hallucinate facts; mark uncertain claims with [VERIFY].
```

## ContentAgent

ContentAgent generates written assets for the marketplace and Studio.

Input:

```typescript
type ContentJobInput = {
  type: "blog" | "thread" | "email" | "script" | "skill_description";
  topic: string;
  tone: "professional" | "casual" | "technical" | "persuasive";
  length: "short" | "medium" | "long";
  keywords?: string[];
  audience?: string;
};
```

## ResearchAgent

ResearchAgent supports current-source synthesis and demand analysis.

Input:

```typescript
type ResearchJobInput = {
  query: string;
  depth: "quick" | "thorough" | "deep";
  format: "bullets" | "report" | "json";
  focus?: "news" | "academic" | "market" | "technical";
};
```

Output shape:

```typescript
type ResearchReport = {
  sources: Array<{ title: string; url: string; publishedAt?: string }>;
  summary: string;
  key_findings: string[];
  confidence_score: number;
};
```

## SkillCoachAgent

SkillCoachAgent provides role-based learning plans and coaching sessions.

Input:

```typescript
type CoachingSession = {
  userId: string;
  currentSkills: string[];
  targetRole: string;
  timeline: string;
  learningStyle: "visual" | "hands-on" | "reading" | "mixed";
  availableHoursPerWeek: number;
  message: string;
};
```

Conversation history should be persisted in Supabase when production coaching storage is enabled.

## WebSocket Protocol

Client to server:

```typescript
type ClientMessage = {
  type: "auth" | "job" | "cancel";
  agent?: "video" | "content" | "research" | "coach";
  payload?: VideoJobInput | ContentJobInput | ResearchJobInput | CoachingSession;
  jobId?: string;
  token?: string;
};
```

Server to client:

```typescript
type ServerMessage = {
  type: "token" | "progress" | "result" | "error";
  jobId: string;
  content?: string;
  progress?: { percent: number; stage: string; message: string };
  result?: unknown;
  error?: string;
};
```

Connections:

- Production: `wss://agents.skillscale.ai`
- Development: `ws://localhost:3001`
- Health: `GET /health`

## Deployment Architecture

Recommended production layout:

```text
Browser / GitHub Pages / Next.js
  -> Supabase Auth and Postgres
  -> Next.js API routes for app-backed actions
  -> WSS agent server for Studio live jobs
```

Agent server options:

| Option | Use |
|---|---|
| DigitalOcean Droplet | Production control, ffmpeg support, predictable cost |
| Railway | Fast MVP deployment with persistent sockets |
| Render | Simple Web Service deployment |

Required environment variables:

```bash
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=
TAVILY_API_KEY=
PEXELS_API_KEY=
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=skillscale-videos
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WS_PORT=3001
NODE_ENV=production
```

## Adding A New Agent

1. Define the agent contract in this file.
2. Add or update the runner in `src/lib/anthropic.ts` or `src/agents/`.
3. Wire API or WebSocket routing.
4. Add scoring or progress events if the agent contributes to audits or jobs.
5. Update weighted formulas, status displays, and docs.
6. Add tests for the new routing and failure behavior.

## Storage And Security Rules

- Public mirrored skill rows are readable through Supabase views.
- Mirror writes must use `SUPABASE_SERVICE_ROLE_KEY`.
- Vault rows live in `vault_items` and are protected by `auth.uid() = user_id`.
- Static GitHub Pages auth uses only the public Supabase URL and anon key.
- Never commit service role keys or provider secrets.
