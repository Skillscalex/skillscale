import { NextResponse } from "next/server";
import { DEFAULT_OCCUPATION_COUNTS } from "@/ingestion/autonomous/occupationCounts";
import { listSkillsmpMirrorCounts } from "@/lib/skillsmp-mirror";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  try {
    const mirrored = await listSkillsmpMirrorCounts();
    if (mirrored?.length) {
      return NextResponse.json({
        generatedAt: new Date().toISOString(),
        source: "Supabase SkillsMP mirror",
        totalMajorGroups: mirrored.length,
        totalOccupations: 867,
        occupations: mirrored,
      }, { headers: CORS_HEADERS });
    }
  } catch {
    // Fall through to static fallback.
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    source: "static-fallback",
    totalMajorGroups: 23,
    totalOccupations: 867,
    occupations: DEFAULT_OCCUPATION_COUNTS.map((occupation) => ({
      ...occupation,
      localCount: 0,
      coveragePercent: 0,
      mirrorStatus: "queued",
    })),
  }, { headers: CORS_HEADERS });
}
