import { NextRequest, NextResponse } from "next/server";
import { runFullAudit } from "@/lib/anthropic";
import { scoreToTier } from "@/types/skill";

export async function POST(req: NextRequest) {
  try {
    const { skillId, title, description, pluginJson } = await req.json();

    if (!skillId) {
      return NextResponse.json({ error: "skillId required" }, { status: 400 });
    }

    // In production: fetch skill from Supabase by skillId
    const skillTitle = title ?? "Untitled Skill";
    const skillDescription = description ?? "No description provided.";

    const { securityResult, modelResult, qualityResult, totalScore } = await runFullAudit(
      skillTitle,
      skillDescription,
      pluginJson ?? null
    );

    const gemTier = scoreToTier(totalScore);

    const auditRecord = {
      skill_id: skillId,
      security_score: securityResult.security_score,
      model_score: modelResult.model_scores[modelResult.best_model],
      quality_score: qualityResult.quality_score,
      total_score: totalScore,
      flagged_issues: securityResult.issues,
      model_recommendation: modelResult.best_model,
      security_result: securityResult,
      model_result: modelResult,
      quality_result: qualityResult,
      audit_model: "claude-opus-4-7",
      status: "completed",
    };

    // In production: upsert into Supabase agent_audits table
    // Also update skills.secure_score and skills.gem_tier

    return NextResponse.json({
      data: auditRecord,
      gem_tier: gemTier,
      total_score: totalScore,
    });
  } catch (err) {
    console.error("Audit error:", err);
    return NextResponse.json({ error: "Audit failed" }, { status: 500 });
  }
}

// Weekly cron re-audit endpoint
export async function GET() {
  // Called by Vercel Cron: 0 0 * * 0
  // In production: fetch all skills, re-run audits in batches
  return NextResponse.json({ message: "Cron audit endpoint ready" });
}
