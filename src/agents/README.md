# Skillscale Agent Server

Real-time AI agent infrastructure for the Skillscale Studio. A persistent WebSocket server running specialized agents — VideoAgent, ContentAgent, ResearchAgent, and SkillCoachAgent — that respond to Studio chatbox input with actual capabilities.

## Directory Structure

```
src/agents/
├── server.ts          ← WebSocket server entry point (ws + express)
├── router.ts          ← Parse ClientMessage → dispatch to correct agent
├── video.ts           ← VideoAgent: topic → script → TTS → video assembly
├── content.ts         ← ContentAgent: blog / thread / email / skill copy
├── research.ts        ← ResearchAgent: web search + scrape + synthesise
├── coach.ts           ← SkillCoachAgent: personalised skill coaching
├── types.ts           ← Shared TypeScript types
├── queue.ts           ← In-memory job queue (Redis-backed at scale)
└── utils/
    ├── ffmpeg.ts      ← Video assembly helpers
    ├── tts.ts         ← ElevenLabs TTS wrapper
    ├── search.ts      ← Tavily search wrapper
    └── r2.ts          ← Cloudflare R2 upload helper
```

## Local Development

### Prerequisites

```bash
# macOS
brew install node ffmpeg

# Ubuntu
apt install -y nodejs npm ffmpeg

# Install project deps
npm install

# Copy env template
cp .env.local.example .env.agents.local
# Fill in ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, TAVILY_API_KEY, PEXELS_API_KEY
```

### Run the Agent Server

```bash
# Development (hot reload via tsx)
npx tsx watch src/agents/server.ts

# Production
NODE_ENV=production npx ts-node src/agents/server.ts
```

Server starts on `ws://localhost:3001`. Health endpoint: `http://localhost:3001/health`.

### Connect from the Studio Frontend

```typescript
// src/hooks/useAgentSocket.ts
const ws = new WebSocket(
  process.env.NEXT_PUBLIC_AGENTS_WS_URL ?? "ws://localhost:3001"
);
```

Set `NEXT_PUBLIC_AGENTS_WS_URL=wss://agents.skillscale.ai` in Vercel environment variables for production.

---

## VideoAgent Pipeline (MoneyPrinterTurbo-style)

Generates faceless AI videos — AI voiceover, B-roll footage, subtitles, background music — from a single topic string.

### Pipeline Stages

```
1. RESEARCH
   ResearchAgent.query("{topic} facts statistics trends")
   → top_facts[], hook_angles[], key_messages[]

2. SCRIPTWRITING  (claude-sonnet-4-6)
   Input:  topic + research + duration + style
   Output: VideoScript JSON — scenes[{ duration, narration, b_roll_query, overlay_text }]
   Constraint: sum(scene.duration) === requested duration ± 2s

3. VOICEOVER  (ElevenLabs TTS)
   Parallel API calls per scene → MP3 audio buffers
   Voices: nova | echo | fable | onyx | shimmer

4. VISUALS  (Pexels Videos API)
   Per-scene b_roll_query → search Pexels → download + trim to scene duration
   Fallback: Stable Diffusion XL for AI-generated imagery when Pexels has no match

5. SUBTITLES  (OpenAI Whisper)
   Transcribe each audio segment → timed SRT strings

6. ASSEMBLY  (ffmpeg)
   Concat video clips → overlay voiceover → mix background music at -18 dB
   Burn subtitles if enabled → encode H.264/AAC → output.mp4

7. UPLOAD  (Cloudflare R2)
   PUT output.mp4 → R2 bucket → CDN URL
   https://cdn.skillscale.ai/videos/{jobId}.mp4
```

### Script JSON Schema

```typescript
type VideoScript = {
  title: string;
  hook: string;          // First 3 seconds — must grab attention
  scenes: VideoScene[];
  outro: string;         // CTA for final 5 seconds
  tags: string[];        // YouTube / TikTok tags
  description: string;   // Platform description
};

type VideoScene = {
  index: number;
  duration: number;           // Seconds
  narration: string;          // Text sent to TTS
  b_roll_query: string;       // Pexels search query
  overlay_text?: string;      // On-screen caption
  transition?: "cut" | "fade" | "slide";
};
```

### Input / Output Types

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

type VideoProgressEvent = {
  jobId: string;
  stage: "researching" | "scripting" | "tts" | "visuals" | "assembly" | "uploading" | "done";
  progress: number;   // 0–100
  message: string;
  url?: string;       // Set when stage === "done"
};
```

### ffmpeg Assembly (equivalent command)

```bash
ffmpeg \
  -i concat_clips.txt \
  -i voiceover_mixed.mp3 \
  -i background_music.mp3 \
  -filter_complex "
    [2:a]volume=0.15[bgm];
    [1:a][bgm]amix=inputs=2:duration=first[audio];
    [0:v]subtitles=subs.srt:force_style='FontSize=24,PrimaryColour=&HFFFFFF'[v]
  " \
  -map "[v]" -map "[audio]" \
  -c:v libx264 -crf 23 -preset fast \
  -c:a aac -b:a 192k \
  -r 30 -movflags +faststart \
  output.mp4
```

---

## WebSocket Protocol

### Connection + Authentication

```typescript
const ws = new WebSocket("wss://agents.skillscale.ai");

ws.onopen = () => {
  // Authenticate with Supabase session token
  ws.send(JSON.stringify({
    type: "auth",
    token: supabaseSession.access_token
  }));
};
```

### Sending a Job

```typescript
const jobId = crypto.randomUUID();

ws.send(JSON.stringify({
  type: "job",
  jobId,
  agent: "video",
  payload: {
    topic: "How to learn TypeScript in 30 days",
    duration: 60,
    voice: "nova",
    style: "educational",
    music: "ambient",
    subtitles: true,
    resolution: "1080p"
  }
}));
```

### Receiving Streamed Events

```typescript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data) as ServerMessage;

  switch (msg.type) {
    case "token":
      // Streaming text — append to current chat bubble
      appendToken(msg.content);
      break;

    case "progress":
      updateJobProgress(msg.jobId, msg.progress.percent, msg.progress.stage);
      break;

    case "result":
      // Final output: video URL, blog markdown, research report, etc.
      handleJobResult(msg.jobId, msg.result);
      break;

    case "error":
      showJobError(msg.jobId, msg.error);
      break;
  }
};
```

### Full Type Definitions

```typescript
type ClientMessage =
  | { type: "auth"; token: string }
  | { type: "job"; jobId: string; agent: AgentName; payload: JobPayload }
  | { type: "cancel"; jobId: string };

type ServerMessage = {
  type: "token" | "progress" | "result" | "error";
  jobId: string;
  content?: string;
  progress?: { percent: number; stage: string; message: string };
  result?: unknown;
  error?: string;
};

type AgentName = "video" | "content" | "research" | "coach";
```

---

## Deployment

### Option A: DigitalOcean Droplet (Production)

**Recommended:** Basic droplet, 2 GB RAM / 1 vCPU — $12/mo. Handles 2–3 concurrent video jobs comfortably.

#### 1. Provision

- Image: Ubuntu 22.04 LTS
- Size: 2 GB / 1 vCPU ($12/mo)
- Region: NYC1 or SFO3
- Enable backups: $2.40/mo

#### 2. System Setup

```bash
ssh root@YOUR_DROPLET_IP

apt update && apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx ffmpeg

# Node 20 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20 && nvm use 20 && nvm alias default 20

npm install -g pm2 ts-node typescript

git clone https://github.com/kitmike/skillscale /app
cd /app && npm install
```

#### 3. Environment File

```bash
# /app/.env.agents
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
TAVILY_API_KEY=tvly-...
PEXELS_API_KEY=...
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY=...
CLOUDFLARE_R2_SECRET_KEY=...
CLOUDFLARE_R2_BUCKET=skillscale-videos
SUPABASE_SERVICE_ROLE_KEY=...
WS_PORT=3001
NODE_ENV=production
```

#### 4. PM2 Process Manager

```bash
pm2 start /app/src/agents/server.ts \
  --name skillscale-agents \
  --interpreter ts-node \
  --max-memory-restart 1500M

pm2 save
pm2 startup   # Auto-start on reboot

# Monitoring
pm2 logs skillscale-agents --lines 100
pm2 monit
```

#### 5. Nginx + SSL

```nginx
# /etc/nginx/sites-available/agents.skillscale.ai
server {
    listen 80;
    server_name agents.skillscale.ai;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;  # Long timeout for video jobs
    }
}
```

```bash
ln -s /etc/nginx/sites-available/agents.skillscale.ai /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d agents.skillscale.ai
```

---

### Option B: Railway (MVP — deploy in under 5 minutes)

```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npx ts-node src/agents/server.ts",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 10,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

```bash
npm install -g @railway/cli
railway login
railway init
railway up
# Add env vars via Railway dashboard
# Railway assigns WSS URL automatically
```

Cost: ~$5–20/mo. Enable "Always On" to prevent cold starts.

---

### Option C: Render (Free tier available)

1. New → Web Service → connect GitHub repo
2. Build command: `npm install`
3. Start command: `npx ts-node src/agents/server.ts`
4. Add all env vars via the Render dashboard
5. Free tier sleeps after 15 min inactivity → upgrade to Starter ($7/mo) for production

---

## Scaling

| Concurrent Video Jobs | Setup | Monthly Cost |
|----------------------|-------|-------------|
| 1–3 | Railway Starter (512 MB) | ~$20 |
| 3–10 | DigitalOcean 4 GB Droplet | ~$24 |
| 10–50 | DO 8 GB + Redis/BullMQ job queue | ~$60 |
| 50+ | Kubernetes cluster (DO/GKE) + job workers | $200+ |

**Storage:** Cloudflare R2 — $0.015/GB/mo + free egress. 1000 videos/day × 50 MB ≈ $22/mo storage.

---

## Supabase Integration (SkillCoachAgent Memory)

```typescript
// Save each coaching turn to Supabase
await supabase.from("coach_sessions").insert({
  user_id: session.userId,
  message: userMessage,
  response: agentResponse,
  created_at: new Date().toISOString()
});

// Retrieve last N turns for context window
const { data: history } = await supabase
  .from("coach_sessions")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(20);
```

---

## Marketplace Integration Points

| Trigger | Agent | Action |
|---------|-------|--------|
| Skill submit (step 3) | ContentAgent | Auto-generate marketplace description |
| Skill detail page | ResearchAgent | "Research this topic" → live context panel |
| Profile page | SkillCoachAgent | "Start coaching" → opens Studio session |
| Submit wizard (step 4) | VideoAgent | Auto-generate 60s demo video for listing |
| Vault skill | ContentAgent | "Write a post about this" → blog draft |
