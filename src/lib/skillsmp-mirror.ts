import { createClient } from "@supabase/supabase-js";

export type SkillsmpMirrorSkill = {
  id: string;
  name: string;
  author: string;
  stars: number;
  description: string;
  tags: string[];
  categories?: string[];
  updatedAt: string;
  occupationId: string;
  githubUrl?: string;
  skillsmpUrl?: string;
  source: "skillsmp-mirror";
  secureScore: number;
  auditStatus: "approved" | "needs_review" | "blocked";
};

export type SkillsmpMirrorOccupationCount = {
  id: string;
  label: string;
  count: number;
  displayCount: string;
  sourceUrl?: string;
  localCount: number;
  coveragePercent: number;
  mirrorStatus: "queued" | "running" | "sampled" | "partial" | "complete" | "failed";
};

function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("your-project")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function formatSkillCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1)}M`;
  if (count >= 10_000) return `${Math.round(count / 1_000)}k`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return count.toLocaleString();
}

function epochSeconds(value: string | null | undefined): string {
  const millis = value ? Date.parse(value) : NaN;
  return String(Math.floor((Number.isFinite(millis) ? millis : Date.now()) / 1000));
}

function secureScoreFor(row: Record<string, any>): number {
  const stars = Number(row.stars ?? 0);
  if (stars >= 500) return 94;
  if (stars >= 100) return 90;
  if (stars >= 25) return 86;
  return 82;
}

function toMirrorSkill(row: Record<string, any>): SkillsmpMirrorSkill {
  const secureScore = secureScoreFor(row);
  return {
    id: String(row.id),
    name: String(row.name),
    author: String(row.author ?? "community"),
    stars: Number(row.stars ?? 0),
    description: String(row.description ?? "SkillsMP mirrored skill."),
    tags: Array.isArray(row.tags) ? row.tags.slice(0, 8) : [],
    categories: Array.isArray(row.categories) ? row.categories : [],
    updatedAt: epochSeconds(row.source_updated_at ?? row.date_modified ?? row.last_seen_at),
    occupationId: String(row.primary_occupation_id ?? "01"),
    ...(row.github_url ? { githubUrl: String(row.github_url) } : {}),
    ...(row.skillsmp_url ? { skillsmpUrl: String(row.skillsmp_url) } : {}),
    source: "skillsmp-mirror",
    secureScore,
    auditStatus: secureScore >= 85 ? "approved" : "needs_review",
  };
}

export async function listSkillsmpMirrorCounts(): Promise<SkillsmpMirrorOccupationCount[] | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("public_skillsmp_occupation_counts")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    label: String(row.label),
    count: Number(row.indexed_count ?? 0),
    displayCount: formatSkillCount(Number(row.indexed_count ?? 0)),
    sourceUrl: row.source_url ? String(row.source_url) : undefined,
    localCount: Number(row.mirrored_count ?? 0),
    coveragePercent: Number(row.coverage_percent ?? 0),
    mirrorStatus: String(row.mirror_status ?? "queued") as SkillsmpMirrorOccupationCount["mirrorStatus"],
  }));
}

export async function searchSkillsmpMirror(options: {
  q?: string;
  occupationId?: string;
  limit?: number;
  page?: number;
  sortBy?: string;
}): Promise<{ skills: SkillsmpMirrorSkill[]; total: number } | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;
  const limit = Math.min(Math.max(Number(options.limit ?? 18), 1), 100);
  const page = Math.max(Number(options.page ?? 1), 1);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("public_skillsmp_skills").select("*", { count: "exact" });
  if (options.occupationId) query = query.eq("primary_occupation_id", options.occupationId);
  if (options.q?.trim()) {
    const q = options.q.trim();
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,author.ilike.%${q}%`);
  }
  const sortColumn = options.sortBy === "updated" ? "last_seen_at" : "stars";
  query = query.order(sortColumn, { ascending: false, nullsFirst: false }).range(from, to);
  const { data, error, count } = await query;
  if (error) throw error;
  return {
    skills: (data ?? []).map(toMirrorSkill),
    total: count ?? 0,
  };
}
