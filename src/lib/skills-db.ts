/**
 * src/lib/skills-db.ts
 * Fetches, normalises, and caches skills from all sources into
 * a unified Supabase table. Designed to be run by the Researcher
 * agent on each evolutionary loop iteration.
 *
 * Sources:
 *  1. Internal Supabase skills table (primary)
 *  2. Claude plugin registry (claude.ai/marketplace API)
 *  3. GitHub awesome-claude-plugins list
 *  4. npm registry (keyword: claude-code-plugin)
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface NormalisedSkill {
  id: string;
  title: string;
  description: string;
  author: string;
  version: string;
  price_usd: number;
  is_free: boolean;
  source: "internal" | "npm" | "github" | "claude-registry";
  tags: string[];
  downloads: number;
  score: number;
  url: string;
  last_synced: string;
}

// ── Fetch from npm registry ──────────────────────────────────────
async function fetchNpmSkills(): Promise<NormalisedSkill[]> {
  try {
    const res = await fetch(
      "https://registry.npmjs.org/-/v1/search?text=keywords:claude-code-plugin&size=50",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.objects ?? []).map((obj: Record<string, unknown>) => {
      const pkg = obj.package as Record<string, unknown>;
      return {
        id: `npm:${pkg.name}`,
        title: String(pkg.name),
        description: String(pkg.description ?? ""),
        author: String((pkg.publisher as Record<string, unknown>)?.username ?? "unknown"),
        version: String(pkg.version ?? "0.0.1"),
        price_usd: 0,
        is_free: true,
        source: "npm" as const,
        tags: (pkg.keywords as string[]) ?? [],
        downloads: Number((obj.downloads as Record<string, unknown>)?.monthly ?? 0),
        score: Number((obj.score as Record<string, unknown>)?.final ?? 0) * 100,
        url: `https://www.npmjs.com/package/${pkg.name}`,
        last_synced: new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

// ── Fetch from GitHub awesome list ───────────────────────────────
async function fetchGithubSkills(): Promise<NormalisedSkill[]> {
  try {
    const res = await fetch(
      "https://api.github.com/search/repositories?q=topic:claude-code-plugin&per_page=30&sort=stars",
      {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).map((repo: Record<string, unknown>) => ({
      id: `github:${repo.full_name}`,
      title: String(repo.name),
      description: String(repo.description ?? ""),
      author: String((repo.owner as Record<string, unknown>)?.login ?? "unknown"),
      version: "latest",
      price_usd: 0,
      is_free: true,
      source: "github" as const,
      tags: (repo.topics as string[]) ?? [],
      downloads: Number(repo.stargazers_count ?? 0),
      score: Math.min(Number(repo.stargazers_count ?? 0) / 10, 100),
      url: String(repo.html_url),
      last_synced: new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

// ── Sync to Supabase ─────────────────────────────────────────────
export async function syncSkillsDatabase(): Promise<{
  inserted: number;
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;

  const [npmSkills, githubSkills] = await Promise.all([
    fetchNpmSkills(),
    fetchGithubSkills(),
  ]);

  const allExternal = [...npmSkills, ...githubSkills];

  for (const skill of allExternal) {
    const { data: existing } = await supabase
      .from("skills")
      .select("id")
      .eq("external_id", skill.id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("skills")
        .update({
          description: skill.description,
          downloads: skill.downloads,
          score: skill.score,
          last_synced: skill.last_synced,
        })
        .eq("external_id", skill.id);
      if (error) errors.push(error.message);
      else updated++;
    } else {
      const { error } = await supabase.from("skills").insert({
        external_id: skill.id,
        title: skill.title,
        description: skill.description,
        author_username: skill.author,
        version: skill.version,
        price_usd: skill.price_usd,
        is_free: skill.is_free,
        source: skill.source,
        tags: skill.tags,
        downloads: skill.downloads,
        score: skill.score,
        url: skill.url,
        last_synced: skill.last_synced,
        is_audited: false,
        gem_tier: "coal",
      });
      if (error) errors.push(error.message);
      else inserted++;
    }
  }

  return { inserted, updated, errors };
}

// ── Fetch all skills from DB (cached) ────────────────────────────
export async function getAllSkills(opts?: {
  tier?: string;
  tag?: string;
  source?: string;
  limit?: number;
}): Promise<NormalisedSkill[]> {
  let query = supabase
    .from("skills")
    .select("*")
    .order("score", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (opts?.tier)   query = query.eq("gem_tier", opts.tier);
  if (opts?.tag)    query = query.contains("tags", [opts.tag]);
  if (opts?.source) query = query.eq("source", opts.source);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as NormalisedSkill[];
}
