# Skillscale Agent Team

## Agent Roster

| Agent | Model | Weight | Role |
|-------|-------|--------|------|
| Orchestrator | claude-opus-4-5 | — | Plans, delegates, reflects |
| Researcher | claude-sonnet-4-5 | 0.15 | WebSearch, trend analysis |
| Designer | claude-sonnet-4-5 | 0.15 | UI/UX critique, Figma specs |
| Engineer | claude-sonnet-4-5 | 0.20 | Architecture, TypeScript |
| Coder | claude-haiku-4-5 | 0.20 | File writes, refactors |
| Debugger | claude-sonnet-4-5 | 0.15 | Lint, test, error trace |
| Validator | claude-sonnet-4-5 | 0.10 | QA, a11y, perf audit |
| Reflector | claude-opus-4-5 | 0.05 | Critique, iterate signal |

## Evolutionary Loop (infinite, autonomous)
search_and_learn → brainstorm → design → critique → engineer →
code → debug → validate → reflect → search_and_learn → iterate → repeat

## Adding a new agent
1. Define agent in this file with model, weight, output schema, system prompt
2. Implement runner in `src/lib/anthropic.ts` following existing pattern
3. Add to `runFullAudit` `Promise.all` array
4. Update weighted score formula
5. Update table above

---

*Agents are implemented in `src/lib/anthropic.ts`. Pipeline is triggered via `src/app/api/audit/route.ts`.*
*AgentOS cost estimator lives at `src/components/AgentCostEstimator.tsx`.*

---

## Real Running Agents — Live Architecture

These agents run as persistent long-lived processes (not serverless), connected to the Skillscale Studio chatbox via WebSocket. They respond to user input in real-time, stream tokens, and carry actual capabilities beyond text generation.

### Live Agent Roster

| Agent | Transport | Runtime | Capabilities |
|-------|-----------|---------|-------------|
| VideoAgent | WebSocket | DigitalOcean Droplet / Railway | Script gen, ElevenLabs TTS, ffmpeg assembly, R2 upload |
| ContentAgent | WebSocket | Railway / Render | Blog posts, social copy, email campaigns, SEO content |
| ResearchAgent | WebSocket | Render | Tavily web search, URL scraping, source synthesis |
| SkillCoachAgent | WebSocket | Railway | Personalized coaching, skill gap analysis, learning plans |

---

### VideoAgent

Inspired by MoneyPrinterTurbo — generates faceless YouTube/TikTok videos from a single topic string.

**Pipeline:**
```
topic input
  → ResearchAgent (gather facts, hooks, angles)
  → script generation (claude-sonnet-4-6, structured JSON: scenes[])
  → voiceover synthesis (ElevenLabs TTS, multiple voice options)
  → background music selection (royalty-free library, mood-matched)
  → image/clip search (Pexels API / Stable Diffusion XL for AI visuals)
  → subtitle generation (Whisper transcription + SRT timing)
  → ffmpeg assembly (overlay audio, subtitles, B-roll clips)
  → upload to Cloudflare R2 → CDN URL returned
  → progress events streamed via WebSocket throughout
```

**Input schema:**
```typescript
type VideoJobInput = {
  topic: string;           // "How to learn TypeScript in 30 days"
  duration: 30 | 60 | 90 | 180;  // seconds
  voice: "nova" | "echo" | "fable" | "onyx" | "shimmer";
  style: "educational" | "motivational" | "storytelling" | "listicle";
  music: "upbeat" | "ambient" | "cinematic" | "none";
  subtitles: boolean;
  resolution: "1080p" | "720p" | "9:16";  // 9:16 for TikTok/Reels
};
```

**Output events (streamed over WebSocket):**
```typescript
type VideoProgressEvent = {
  jobId: string;
  stage: "researching" | "scripting" | "tts" | "visuals" | "assembly" | "uploading" | "done";
  progress: number;  // 0–100
  message: string;
  url?: string;      // populated when stage === "done"
};
```

**System prompt:**
```
You are VideoAgent, a professional faceless video content creator.
Given a topic, produce a complete video script as structured JSON.
Each scene has: duration (seconds), narration (text for TTS),
b_roll_query (image search terms), overlay_text (optional caption).
Make content engaging, educational, and optimized for retention.
Never hallucinate facts — flag uncertain claims with [VERIFY].
```

**Model:** `claude-sonnet-4-6`

---

### ContentAgent

Generates long-form and short-form written content on demand.

**Capabilities:**
- Blog posts (1000–4000 words, SEO-optimised, markdown output)
- Social media threads (Twitter/X, LinkedIn, formatted)
- Email campaigns (subject lines + body, A/B variants)
- Video scripts (YouTube descriptions, hooks, CTAs)
- Skill descriptions for the marketplace (auto-populated on submit)

**Input:**
```typescript
type ContentJobInput = {
  type: "blog" | "thread" | "email" | "script" | "skill_description";
  topic: string;
  tone: "professional" | "casual" | "technical" | "persuasive";
  length: "short" | "medium" | "long";
  keywords?: string[];   // for SEO targeting
  audience?: string;     // "junior devs", "CTOs", "indie hackers"
};
```

**Model:** `claude-sonnet-4-6` (balanced quality/cost for volume)

---

### ResearchAgent

Real-time web research with source citation and synthesis.

**Capabilities:**
- Tavily API search (real-time web index, not training data)
- URL scraping + content extraction (Puppeteer)
- Multi-source synthesis with citation tracking
- Trend detection (GitHub trending, HN, Product Hunt APIs)
- Competitor analysis and market research
- Skill demand analysis (job board scraping)

**Input:**
```typescript
type ResearchJobInput = {
  query: string;
  depth: "quick" | "thorough" | "deep";  // 1 / 3 / 7 sources
  format: "bullets" | "report" | "json";
  focus?: "news" | "academic" | "market" | "technical";
};
```

**Output:** Structured report with `sources[]`, `summary`, `key_findings[]`, `confidence_score`

**Model:** `claude-haiku-4-5` for initial scraping + extraction; `claude-sonnet-4-6` for final synthesis

---

### SkillCoachAgent

Personalized AI skill coach — assesses gaps, builds learning plans, tracks progress.

**Capabilities:**
- Skill gap assessment (compare current vs target role)
- Personalized weekly learning plan generation
- Resource curation (courses, docs, projects, mentors)
- Progress tracking and milestone celebration
- Mock interview / quiz sessions
- Recommends relevant marketplace skills to purchase

**Input:**
```typescript
type CoachingSession = {
  userId: string;
  currentSkills: string[];
  targetRole: string;
  timeline: string;                  // "3 months", "1 year"
  learningStyle: "visual" | "hands-on" | "reading" | "mixed";
  availableHoursPerWeek: number;
  message: string;                   // free-form chat turn
};
```

**Model:** `claude-sonnet-4-6`; conversation history persisted per `userId` in Supabase `coach_sessions` table

---

## Deployment Architecture

### Option A: DigitalOcean Droplet (Recommended for Production)

```
┌─────────────────────────────────────────────┐
│  DigitalOcean Droplet  ($12/mo, 2 GB RAM)   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Node.js WebSocket Server           │   │
│  │  ws://0.0.0.0:3001                  │   │
│  │                                     │   │
│  │  VideoAgent   ContentAgent          │   │
│  │  ResearchAgent  SkillCoachAgent     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Nginx (SSL termination → proxy :3001)      │
└─────────────────────────────────────────────┘
           ↕ WSS (secure WebSocket)
┌─────────────────────────────┐
│  Vercel (Next.js frontend)  │
│  src/app/studio/page.tsx    │
└─────────────────────────────┘
```

**Quick setup:**
```bash
# Ubuntu 22.04 LTS droplet
apt update && apt install -y nodejs npm nginx certbot ffmpeg

# Install deps + PM2
cd /app && npm install
npm install -g pm2
pm2 start src/agents/server.ts --name skillscale-agents --interpreter ts-node
pm2 save && pm2 startup

# Nginx WebSocket proxy + Let's Encrypt SSL
certbot --nginx -d agents.skillscale.ai
```

### Option B: Railway (MVP — deploy in minutes)

```json
{
  "deploy": {
    "startCommand": "npx ts-node src/agents/server.ts",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

Railway auto-provisions HTTPS, persistent sockets, and horizontal scaling. Cost: ~$5–20/mo.

### Option C: Render (Free tier available)

- New Web Service → start command: `npx ts-node src/agents/server.ts`
- Enable "Background Worker" to prevent sleep on free tier
- Upgrade to Starter ($7/mo) for always-on production use

---

## WebSocket Message Protocol

```typescript
// Client → Server
type ClientMessage = {
  type: "auth" | "job" | "cancel";
  agent?: "video" | "content" | "research" | "coach";
  payload?: VideoJobInput | ContentJobInput | ResearchJobInput | CoachingSession;
  jobId?: string;   // client-generated UUID
  token?: string;   // Supabase JWT (for auth messages)
};

// Server → Client (streamed)
type ServerMessage = {
  type: "token" | "progress" | "result" | "error";
  jobId: string;
  content?: string;         // for "token" — append to current message
  progress?: { percent: number; stage: string; message: string };
  result?: unknown;         // final output (video URL, blog post, report)
  error?: string;
};
```

**Connection:** `wss://agents.skillscale.ai` (prod) | `ws://localhost:3001` (dev)  
**Health check:** `GET /health` → `{ status: "ok", agents: { video, content, research, coach } }`

---

## Agent Server Environment Variables

```bash
ANTHROPIC_API_KEY=          # Claude API (all agents)
ELEVENLABS_API_KEY=         # TTS voiceovers (VideoAgent)
TAVILY_API_KEY=             # Web search (ResearchAgent)
PEXELS_API_KEY=             # Stock footage (VideoAgent)
CLOUDFLARE_R2_ACCOUNT_ID=   # Video storage
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=skillscale-videos
SUPABASE_SERVICE_ROLE_KEY=  # Session memory (SkillCoachAgent)
WS_PORT=3001
NODE_ENV=production
```

See [`src/agents/README.md`](src/agents/README.md) for full deployment walkthrough.
