import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateSkillSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(20).max(2000),
  category: z.string().min(1),
  tags: z.array(z.string()).max(10),
  price_usd: z.number().min(0),
  is_free: z.boolean(),
  gem_tier: z.enum(["coal", "quartz", "pearl", "emerald", "diamond"]).default("quartz"),
  mint_as_nft: z.boolean().default(false),
  plugin_json: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tier = searchParams.get("tier");
  const category = searchParams.get("category");
  const free = searchParams.get("free") === "true";
  const sort = searchParams.get("sort") ?? "trending";
  const q = searchParams.get("q");

  // In production: query Supabase
  // For now return mock data shape
  return NextResponse.json({
    data: [],
    count: 0,
    filters: { tier, category, free, sort, q },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = CreateSkillSchema.parse(body);

    // In production: insert into Supabase, trigger audit pipeline
    const newSkill = {
      id: "skill-" + Date.now(),
      ...data,
      creator_id: "user-demo",
      secure_score: null,
      model_recommendation: null,
      is_minted: false,
      nft_token_id: null,
      crypto_price_eth: null,
      downloads: 0,
      created_at: new Date().toISOString(),
    };

    // Trigger audit in background
    fetch(`${req.nextUrl.origin}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId: newSkill.id }),
    }).catch(() => {});

    return NextResponse.json({ data: newSkill }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
