import { NextResponse } from "next/server";
import { syncSkillsDatabase, getAllSkills } from "@/lib/skills-db";

export async function GET() {
  try {
    const skills = await getAllSkills({ limit: 200 });
    return NextResponse.json({ skills, count: skills.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "DB error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await syncSkillsDatabase();
    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Sync error" }, { status: 500 });
  }
}
