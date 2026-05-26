import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { syncSkillsDatabase } from "@/lib/skills-db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Agent definitions ────────────────────────────────────────────
const AGENTS = {
  orchestrator: { model: "claude-opus-4-5",   maxTokens: 2048 },
  researcher:   { model: "claude-sonnet-4-5", maxTokens: 1024 },
  designer:     { model: "claude-sonnet-4-5", maxTokens: 1024 },
  engineer:     { model: "claude-sonnet-4-5", maxTokens: 2048 },
  coder:        { model: "claude-haiku-4-5",  maxTokens: 4096 },
  debugger:     { model: "claude-sonnet-4-5", maxTokens: 1024 },
  validator:    { model: "claude-sonnet-4-5", maxTokens: 512  },
  reflector:    { model: "claude-opus-4-5",   maxTokens: 512  },
} as const;

type AgentName = keyof typeof AGENTS;

interface AgentResult {
  agent: AgentName;
  output: string;
  tokens_used: { input: number; output: number };
  duration_ms: number;
}

// ── Single agent call ────────────────────────────────────────────
async function callAgent(
  name: AgentName,
  systemPrompt: string,
  userMessage: string
): Promise<AgentResult> {
  const cfg = AGENTS[name];
  const start = Date.now();

  const msg = await anthropic.messages.create({
    model: cfg.model,
    max_tokens: cfg.maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const output = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");

  return {
    agent: name,
    output,
    tokens_used: {
      input: msg.usage.input_tokens,
      output: msg.usage.output_tokens,
    },
    duration_ms: Date.now() - start,
  };
}

// ── Plan phase (Orchestrator) ────────────────────────────────────
async function planPhase(task: string): Promise<AgentResult> {
  return callAgent(
    "orchestrator",
    `You are the Skillscale Orchestrator. You plan agentic tasks for the team.
Return a JSON object with:
{ "steps": ["step1", ...], "priority": "high|medium|low", "estimated_loops": number }
Think in the evolutionary loop: search→brainstorm→design→critique→engineer→code→debug→validate→reflect→iterate.
Always respect usage limits: prefer Haiku for volume, Sonnet for logic, Opus only for planning/reflection.`,
    `TASK: ${task}\n\nProduce a concise execution plan (max 10 steps).`
  );
}

// ── Execute phase (parallel agents) ─────────────────────────────
async function executePhase(
  task: string,
  plan: string
): Promise<AgentResult[]> {
  const context = `TASK: ${task}\nPLAN: ${plan}`;

  const [researcher, designer, engineer] = await Promise.all([
    callAgent(
      "researcher",
      "You are the Researcher agent. Search knowledge and synthesise findings relevant to the task. Be concise and cite sources where possible.",
      `${context}\n\nResearch findings needed:`
    ),
    callAgent(
      "designer",
      "You are the Designer agent. Critique the current UI/UX and propose improvements for both mobile (375px) and desktop. Focus on the light-creamy theme with CSS variables.",
      `${context}\n\nDesign critique and proposals:`
    ),
    callAgent(
      "engineer",
      "You are the Engineer agent. Design the technical architecture, data models, and API contracts needed. Output TypeScript-first solutions.",
      `${context}\n\nTechnical architecture:`
    ),
  ]);

  const coder = await callAgent(
    "coder",
    "You are the Coder agent. Write production-ready TypeScript/TSX code. Follow the existing patterns in the Skillscale codebase. Use the light-creamy CSS variables.",
    `${context}\nResearch: ${researcher.output}\nDesign: ${designer.output}\nArchitecture: ${engineer.output}\n\nImplementation:`
  );

  const [debugger_, validator] = await Promise.all([
    callAgent(
      "debugger",
      "You are the Debugger agent. Identify bugs, type errors, and edge cases in the proposed implementation. List issues with severity.",
      `CODE:\n${coder.output}\n\nIssues found:`
    ),
    callAgent(
      "validator",
      "You are the Validator agent. Check WCAG AA accessibility, mobile responsiveness (375px, 768px, 1280px), and performance. Score 0-100.",
      `CODE:\n${coder.output}\n\nValidation report:`
    ),
  ]);

  const reflector = await callAgent(
    "reflector",
    "You are the Reflector agent. Synthesise all outputs, score the iteration 0-100, identify the top bottleneck, and recommend the next iteration focus.",
    `TASK: ${task}\nRESEARCH: ${researcher.output}\nDESIGN: ${designer.output}\nCODE: ${coder.output}\nDEBUG: ${debugger_.output}\nVALIDATE: ${validator.output}\n\nReflection and score:`
  );

  return [researcher, designer, engineer, coder, debugger_, validator, reflector];
}

// ── POST /api/orchestrate ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, mode = "plan", sync_skills = false } = body as {
      task: string;
      mode?: "plan" | "execute";
      sync_skills?: boolean;
    };

    if (!task || typeof task !== "string") {
      return NextResponse.json({ error: "task is required" }, { status: 400 });
    }

    const results: AgentResult[] = [];
    let skillsSync = null;

    // Optionally sync skills DB
    if (sync_skills) {
      skillsSync = await syncSkillsDatabase();
    }

    // Plan phase (always runs)
    const planResult = await planPhase(task);
    results.push(planResult);

    // Execute phase (only if mode === "execute")
    if (mode === "execute") {
      const execResults = await executePhase(task, planResult.output);
      results.push(...execResults);
    }

    // Cost summary
    const totalInput  = results.reduce((s, r) => s + r.tokens_used.input,  0);
    const totalOutput = results.reduce((s, r) => s + r.tokens_used.output, 0);

    return NextResponse.json({
      task,
      mode,
      results,
      usage_summary: {
        total_input_tokens:  totalInput,
        total_output_tokens: totalOutput,
        agents_called: results.length,
      },
      skills_sync: skillsSync,
    });
  } catch (err) {
    console.error("[orchestrate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ── GET /api/orchestrate — health check ─────────────────────────
export async function GET() {
  return NextResponse.json({
    status: "ready",
    agents: Object.keys(AGENTS),
    loop_phases: [
      "search_and_learn","brainstorm","design","critique",
      "engineer","code","debug","validate","reflect","iterate",
    ],
  });
}
