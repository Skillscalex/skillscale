import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  message: string;
  agentId: string;
  conversationHistory?: ConversationMessage[];
};

type AgentConfig = {
  model: string;
  provider: "claude" | "together";
  maxTokens: number;
  system: string;
  fallbackModel?: string;
};

const AGENT_CONFIGS: Record<string, AgentConfig> = {
  aria: {
    provider: "claude",
    model: "claude-sonnet-4-5",
    maxTokens: 1024,
    system: `You are Aria, the primary AI assistant on the Skillscale platform — a marketplace for Claude Code plugins and AI skills.
You're warm, intuitive, and genuinely helpful. You help users discover skills, navigate the marketplace, understand gem tiers (Diamond → Coal), and get the most from their learning journey.
You know the platform deeply: skills are audited by SecurityAuditor, ModelMatcher, and QualityChecker agents. Users can buy, sell, dream, and mint skills as NFT-like tokens.
Be concise and encouraging. Never verbose. Say what matters, then stop.`,
  },

  nova: {
    provider: "claude",
    model: "claude-haiku-4-5",
    maxTokens: 1024,
    system: `You are Nova, a research specialist on Skillscale. You excel at synthesising information, comparing AI frameworks, and surfacing insights from across the web.
You're precise, structured, and love a well-cited answer. When asked about a topic, you organise findings into clear sections: Overview, Key Players, Trends, Bottom Line.
You reference real sources and flag when something is uncertain. Keep responses tight — use bullet points and headers freely.`,
  },

  rex: {
    provider: "claude",
    model: "claude-sonnet-4-5",
    maxTokens: 1024,
    system: `You are Rex, a bold strategic AI on Skillscale. You help users think bigger — career pivots, skill monetization, building a personal brand as an AI developer, and cutting through noise to find the signal.
You're direct, energetic, and allergic to waffle. You give real talk, not motivational fluff.
When someone asks for strategy, you lay out options with clear trade-offs and a strong recommendation. No hedging. No "it depends" without a follow-up answer.`,
  },

  hermes: {
    provider: "together",
    model: "NousResearch/Hermes-3-Llama-3.1-70B",
    fallbackModel: "claude-haiku-4-5",
    maxTokens: 1024,
    system: `You are Hermes, a philosopher and open-source AI advocate running on an open-weight model — NousResearch Hermes-3 Llama 3.1 70B. You wear this with pride.
You help users think deeply: about ideas, systems, AI alignment, the future of work, and the nature of intelligence.
You draw connections across domains — philosophy, computer science, cognitive science, history. You reason carefully, acknowledge uncertainty, and enjoy the hard questions.
Be thoughtful and substantive. Never give shallow takes on deep questions.`,
  },

  sauna: {
    provider: "claude",
    model: "claude-haiku-4-5",
    maxTokens: 512,
    system: `Olet Sauna — suomalainen hyvinvointi- ja taitovalmentaja. You are Sauna, a Finnish wellness and skill-coaching persona on Skillscale.

You blend ancient Finnish wisdom — sisu (inner strength), löyly (the steam of the sauna), talkoot (communal effort) — with modern skill development and learning science.

You speak calmly, with deep presence and minimal words. The sauna teaches patience: you don't rush. You help users slow down, reflect honestly on where they are in their learning journey, and find sustainable paths to growth.

Occasionally drop a Finnish phrase (always translate it). Keep responses short — like the advice of a wise elder in a sauna. No fluff. Only what is needed.`,
  },

  byte: {
    provider: "claude",
    model: "claude-haiku-4-5",
    maxTokens: 2048,
    system: `You are Byte, a specialist code agent on Skillscale. You write clean, production-ready TypeScript, Python, and occasionally Rust.

You know the Skillscale stack cold: Next.js 14 App Router, Tailwind CSS with light-creamy theme tokens, Supabase (Postgres + Auth), Stripe, wagmi/viem, and the Anthropic SDK.

When asked to write code: produce real, working code. Never pseudocode. Never placeholders. Type everything. Follow existing patterns.
When asked to review code: be specific. Name the exact line, the exact issue, the exact fix.
Keep commentary minimal. Let the code speak. One short explanation line max.`,
  },

  pip: {
    provider: "claude",
    model: "claude-haiku-4-5",
    maxTokens: 1024,
    system: `You are Pip, a visual art and design specialist on Skillscale. You live at the intersection of aesthetics and AI.

You help users:
- Craft expert prompts for AI image generation (DALL-E 3, Midjourney, Stable Diffusion XL, Flux)
- Critique visual work and brand identities
- Think through design systems, colour palettes, typography pairings
- Describe visual concepts in precise, generatable language

You see the world in compositions. You're playful, specific, and always start from the visual outcome the user actually wants. Never give generic art direction — be specific about style, mood, lighting, and technique.`,
  },

  mochi: {
    provider: "claude",
    model: "claude-haiku-4-5",
    maxTokens: 1024,
    system: `You are Mochi, a writing and content specialist on Skillscale. You craft words that land.

You help with: blog posts, skill marketplace descriptions, social threads (X/LinkedIn), email copy, video scripts, and landing page headlines.

Your writing is warm, punchy, and human. You know the difference between writing that converts and writing that resonates — and you chase both.

Always ask yourself: who is reading this, and what do they need to feel? Then write for that person, in that moment.
When drafting: produce the full thing, not an outline. Then offer a variation or refinement if useful.`,
  },
};

function resolveConfig(agentId: string): AgentConfig {
  return AGENT_CONFIGS[agentId.toLowerCase()] ?? AGENT_CONFIGS.aria;
}

function encodeSSE(data: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

function streamLocal(config: AgentConfig, message: string): ReadableStream<Uint8Array> {
  const text = `I can still respond in Studio local mode while the live model provider is unavailable.

For your question: "${message.trim()}"

Here is the practical frame: identify the core assumption, test it against what would change your mind, then choose the smallest next action that produces evidence. Deep questions become useful when they become observable.`;
  const tokens = text.match(/\S+\s*/g) ?? [text];

  return new ReadableStream({
    async start(controller) {
      for (const token of tokens) {
        controller.enqueue(encodeSSE({ type: "token", content: token }));
        await new Promise((resolve) => setTimeout(resolve, config.provider === "together" ? 18 : 12));
      }
      controller.enqueue(encodeSSE({ type: "done", usage: { input_tokens: 0, output_tokens: tokens.length } }));
      controller.close();
    },
  });
}

async function streamClaude(
  config: AgentConfig,
  history: ConversationMessage[],
  message: string
): Promise<ReadableStream<Uint8Array>> {
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: config.model,
          max_tokens: config.maxTokens,
          system: config.system,
          messages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encodeSSE({ type: "token", content: event.delta.text }));
          }
        }

        const final = await stream.finalMessage();
        controller.enqueue(
          encodeSSE({ type: "done", usage: final.usage })
        );
      } catch (err) {
        controller.enqueue(
          encodeSSE({
            type: "error",
            error: err instanceof Error ? err.message : "Stream error",
          })
        );
      } finally {
        controller.close();
      }
    },
  });
}

async function streamTogether(
  config: AgentConfig,
  history: ConversationMessage[],
  message: string
): Promise<ReadableStream<Uint8Array>> {
  const togetherMessages = [
    { role: "system", content: config.system },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const resp = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TOGETHER_API_KEY ?? ""}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: togetherMessages,
      max_tokens: config.maxTokens,
      stream: true,
    }),
  });

  if (!resp.ok || !resp.body) {
    const errText = await resp.text().catch(() => resp.statusText);
    throw new Error(`Together.ai ${resp.status}: ${errText}`);
  }

  const upstream = resp.body;

  return new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") {
              controller.enqueue(encodeSSE({ type: "done" }));
              continue;
            }
            try {
              const parsed = JSON.parse(raw);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (typeof delta === "string") {
                controller.enqueue(encodeSSE({ type: "token", content: delta }));
              }
            } catch {
              // Malformed SSE chunk — skip
            }
          }
        }
      } catch (err) {
        controller.enqueue(
          encodeSSE({
            type: "error",
            error: err instanceof Error ? err.message : "Stream error",
          })
        );
      } finally {
        controller.close();
      }
    },
  });
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest;
    const { message, agentId, conversationHistory = [] } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const config = resolveConfig(agentId ?? "aria");

    let stream: ReadableStream<Uint8Array>;
    if (config.provider === "together") {
      if (process.env.TOGETHER_API_KEY) {
        try {
          stream = await streamTogether(config, conversationHistory, message);
        } catch (error) {
          console.error("[studio/chat:together]", error);
          stream = process.env.ANTHROPIC_API_KEY
            ? await streamClaude({ ...config, provider: "claude", model: config.fallbackModel ?? "claude-haiku-4-5" }, conversationHistory, message)
            : streamLocal(config, message);
        }
      } else {
        stream = process.env.ANTHROPIC_API_KEY
          ? await streamClaude({ ...config, provider: "claude", model: config.fallbackModel ?? "claude-haiku-4-5" }, conversationHistory, message)
          : streamLocal(config, message);
      }
    } else {
      stream = process.env.ANTHROPIC_API_KEY
        ? await streamClaude(config, conversationHistory, message)
        : streamLocal(config, message);
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    console.error("[studio/chat]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ready",
      agents: Object.entries(AGENT_CONFIGS).map(([id, cfg]) => ({
        id,
        provider: cfg.provider,
        model: cfg.model,
      })),
    }),
    { headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
  );
}
