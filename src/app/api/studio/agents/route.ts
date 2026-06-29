import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

const AGENTS = [
  // ── AI Assistants ────────────────────────────────────────────────
  {
    id: "aria",
    name: "Aria",
    role: "Generalist",
    group: "assistants",
    groupLabel: "AI Assistants",
    model: "claude-sonnet-4-5",
    provider: "claude",
    status: "online",
    capabilities: ["research", "writing", "analysis", "marketplace guidance"],
    style: "avataaars",
    seed: "aria-skill",
    color: "#177CB0",
    description: "Your primary assistant. Warm, intuitive, and knows the Skillscale platform deeply.",
  },
  {
    id: "rex",
    name: "Rex",
    role: "Analysis",
    group: "assistants",
    groupLabel: "AI Assistants",
    model: "claude-sonnet-4-5",
    provider: "claude",
    status: "online",
    capabilities: ["strategy", "career advice", "skill monetization", "market analysis"],
    style: "avataaars",
    seed: "rex-blue",
    color: "#1565C0",
    description: "Bold strategic thinker. Cuts through noise, gives real talk on career and skill positioning.",
  },
  {
    id: "nova",
    name: "Nova",
    role: "Research",
    group: "assistants",
    groupLabel: "AI Assistants",
    model: "claude-haiku-4-5",
    provider: "claude",
    status: "online",
    capabilities: ["research synthesis", "framework comparison", "trend analysis", "source citation"],
    style: "avataaars",
    seed: "nova-nb",
    color: "#4B5CC4",
    description: "Research specialist. Structures findings clearly with sources, trends, and bottom-line summaries.",
  },

  // ── Hermes Agents ────────────────────────────────────────────────
  {
    id: "hermes",
    name: "Hermes",
    role: "Philosopher",
    group: "hermes",
    groupLabel: "Hermes Agents",
    model: "NousResearch/Hermes-3-Llama-3.1-70B",
    provider: "together",
    status: "online",
    capabilities: ["philosophy", "deep reasoning", "AI alignment", "cross-domain synthesis"],
    style: "shapes",
    seed: "hermes-gold",
    color: "#4B5CC4",
    description: "Open-source philosopher running on Hermes-3 Llama 70B. Tackles the hard questions with depth.",
  },
  {
    id: "sauna",
    name: "Sauna",
    role: "Wellness Coach",
    group: "hermes",
    groupLabel: "Hermes Agents",
    model: "claude-haiku-4-5",
    provider: "claude",
    status: "online",
    capabilities: ["skill coaching", "learning plans", "burnout recovery", "Finnish wisdom"],
    style: "shapes",
    seed: "sauna-steam",
    color: "#2E7D52",
    description: "Finnish wellness coach. Blends sisu, löyly, and learning science into calm, sustainable growth.",
  },

  // ── Claude Agents ─────────────────────────────────────────────────
  {
    id: "byte",
    name: "Byte",
    role: "Code",
    group: "claude",
    groupLabel: "Claude Agents",
    model: "claude-haiku-4-5",
    provider: "claude",
    status: "online",
    capabilities: ["TypeScript", "Python", "Next.js", "code review", "debugging"],
    style: "fun-emoji",
    seed: "byte-zap",
    color: "#0065A2",
    description: "Production-grade code agent. TypeScript-first, knows the Skillscale stack cold.",
  },
  {
    id: "pip",
    name: "Pip",
    role: "Art & Design",
    group: "claude",
    groupLabel: "Claude Agents",
    model: "claude-haiku-4-5",
    provider: "claude",
    status: "online",
    capabilities: ["image prompts", "brand design", "Midjourney", "Stable Diffusion", "DALL-E"],
    style: "fun-emoji",
    seed: "pip-star",
    color: "#E91E63",
    description: "Visual art specialist. Crafts expert image gen prompts and critiques design systems.",
  },
  {
    id: "mochi",
    name: "Mochi",
    role: "Writing",
    group: "claude",
    groupLabel: "Claude Agents",
    model: "claude-haiku-4-5",
    provider: "claude",
    status: "online",
    capabilities: ["blog posts", "social copy", "email campaigns", "video scripts", "skill descriptions"],
    style: "fun-emoji",
    seed: "mochi-leaf",
    color: "#2E7D32",
    description: "Writing specialist. Warm, punchy copy that converts and resonates.",
  },
] as const;

export async function GET() {
  // Check which providers are configured
  const claudeAvailable = !!process.env.ANTHROPIC_API_KEY;
  const togetherAvailable = !!process.env.TOGETHER_API_KEY;

  const agentsWithStatus = AGENTS.map((agent) => {
    const providerOnline =
      agent.provider === "claude" ? claudeAvailable : togetherAvailable;
    const fallbackOnline = agent.provider === "together" && claudeAvailable;
    return {
      ...agent,
      status: "online",
      providerConfigured: providerOnline,
      fallbackConfigured: fallbackOnline,
      mode: providerOnline ? "live" : fallbackOnline ? "fallback" : "local",
    };
  });

  return NextResponse.json(
    {
      agents: agentsWithStatus,
      groups: [
        { id: "assistants", label: "AI Assistants", icon: "◈" },
        { id: "hermes",     label: "Hermes Agents",  icon: "⚡" },
        { id: "claude",     label: "Claude Agents",  icon: "🐾" },
      ],
      providers: {
        claude: { configured: claudeAvailable, models: ["claude-sonnet-4-5", "claude-haiku-4-5"] },
        together: { configured: togetherAvailable, models: ["NousResearch/Hermes-3-Llama-3.1-70B"] },
      },
    },
    { headers: CORS_HEADERS }
  );
}
