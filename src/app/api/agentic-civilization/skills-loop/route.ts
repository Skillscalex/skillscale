import { NextRequest, NextResponse } from "next/server";
import { runAutonomousSkillLoop } from "@/ingestion/autonomous";

export async function GET() {
  const run = await runAutonomousSkillLoop();
  return NextResponse.json({
    module: "agentic-civilization.skills-loop",
    externalExecution: false,
    run,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const allowExternalFetch = body.allowExternalFetch === true;
  const live = body.live === true;
  const run = await runAutonomousSkillLoop({
    allowExternalFetch,
    dryRun: !live,
    maxSources: typeof body.maxSources === "number" ? body.maxSources : undefined,
    maxCandidatesPerSource: typeof body.maxCandidatesPerSource === "number" ? body.maxCandidatesPerSource : undefined,
  });

  return NextResponse.json({
    module: "agentic-civilization.skills-loop",
    externalExecution: run.externalExecution,
    run,
  });
}
