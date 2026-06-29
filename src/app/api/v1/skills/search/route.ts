import { NextRequest, NextResponse } from "next/server";
import { searchSkillsmpMirror } from "@/lib/skillsmp-mirror";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type SkillRecord = {
  id?: string | number;
  name?: string;
  title?: string;
  slug?: string;
  author?: string;
  authorName?: string;
  description?: string;
  summary?: string;
  tags?: string[];
  stars?: number;
  starCount?: number;
  updatedAt?: string;
  updated_at?: string;
};

const FALLBACK_SKILLS = [
  { id: "local-code-review", name: "code-review-agent", author: "skillscale", stars: 1842, description: "Review pull requests, identify risky changes, and suggest production-ready fixes.", tags: ["code", "review"], updatedAt: "1745280000" },
  { id: "local-rag-builder", name: "rag-pipeline-builder", author: "skillscale", stars: 1620, description: "Design retrieval pipelines, chunking strategies, and evaluation plans for knowledge assistants.", tags: ["rag", "search"], updatedAt: "1745280000" },
  { id: "local-market-research", name: "market-research-agent", author: "skillscale", stars: 1398, description: "Summarize competitors, positioning, pricing, and demand signals into a concise brief.", tags: ["research", "market"], updatedAt: "1745280000" },
  { id: "local-email-campaign", name: "email-campaign-writer", author: "skillscale", stars: 1207, description: "Draft segmented lifecycle emails with subject lines, variants, and CTA recommendations.", tags: ["email", "marketing"], updatedAt: "1745280000" },
  { id: "local-sql-analyst", name: "sql-analyst", author: "skillscale", stars: 1103, description: "Translate business questions into SQL, charts, and clear analytical takeaways.", tags: ["sql", "analytics"], updatedAt: "1745280000" },
  { id: "local-lesson-planner", name: "lesson-planner", author: "skillscale", stars: 942, description: "Create differentiated lesson plans, rubrics, quizzes, and classroom activities.", tags: ["education", "planning"], updatedAt: "1745280000" },
];

function normalizeSkill(raw: SkillRecord, index: number) {
  const name = raw.name ?? raw.title ?? raw.slug ?? `skill-${index + 1}`;
  return {
    id: String(raw.id ?? raw.slug ?? name),
    name,
    author: raw.author ?? raw.authorName ?? "community",
    stars: Number(raw.stars ?? raw.starCount ?? 0),
    description: raw.description ?? raw.summary ?? "Community skill for agentic workflows.",
    tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 8) : [],
    updatedAt: raw.updatedAt ?? raw.updated_at ?? "1745280000",
  };
}

function fallbackFor(query: string, limit: number, page: number) {
  const q = query.toLowerCase();
  const filtered = FALLBACK_SKILLS.filter((skill) =>
    !q ||
    skill.name.includes(q) ||
    skill.description.toLowerCase().includes(q) ||
    skill.tags.some((tag) => tag.includes(q))
  );
  const source = filtered.length ? filtered : FALLBACK_SKILLS;
  const start = (page - 1) * limit;
  return {
    success: true,
    data: {
      skills: source.slice(start, start + limit),
      pagination: { page, limit, total: source.length },
    },
    source: "fallback",
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit") ?? 18), 1), 50);
  const page = Math.max(Number(req.nextUrl.searchParams.get("page") ?? 1), 1);
  const sortBy = req.nextUrl.searchParams.get("sortBy") ?? "stars";
  const occupationId = req.nextUrl.searchParams.get("occupationId") ?? undefined;

  try {
    const mirror = await searchSkillsmpMirror({ q, occupationId, limit, page, sortBy });
    if (mirror && mirror.skills.length) {
      return NextResponse.json(
        {
          success: true,
          data: {
            skills: mirror.skills,
            pagination: { page, limit, total: mirror.total },
          },
          source: "supabase-mirror",
        },
        { headers: CORS_HEADERS }
      );
    }

    const upstreamUrl = new URL("https://skillsmp.com/api/v1/skills/search");
    upstreamUrl.searchParams.set("q", q);
    upstreamUrl.searchParams.set("limit", String(limit));
    upstreamUrl.searchParams.set("page", String(page));
    upstreamUrl.searchParams.set("sortBy", sortBy);

    const resp = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Skillscale/0.1 (+https://skillscale.local)",
      },
      next: { revalidate: 3600 },
    });

    if (!resp.ok) throw new Error(`Upstream returned ${resp.status}`);
    const json = await resp.json();
    const skills = json?.data?.skills;
    if (!Array.isArray(skills)) throw new Error("Unexpected upstream response");

    return NextResponse.json(
      {
        success: true,
        data: {
          skills: skills.map(normalizeSkill),
          pagination: json.data.pagination ?? { page, limit, total: skills.length },
        },
        source: "live",
      },
      { headers: CORS_HEADERS }
    );
  } catch {
    return NextResponse.json(fallbackFor(q, limit, page), { headers: CORS_HEADERS });
  }
}
