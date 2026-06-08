import { NextRequest, NextResponse } from "next/server";
import { createInitialCivilizationState, runCivilizationCycle } from "@/lib/agentic-civilization";

export async function GET() {
  const run = runCivilizationCycle();
  return NextResponse.json({
    status: "ready",
    module: "agentic-civilization",
    externalExecution: false,
    run,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const goal = typeof body.goal === "string" ? body.goal : undefined;
    const tension = typeof body.tension === "string" ? body.tension : undefined;
    const state = createInitialCivilizationState({ goal, tension });
    const run = runCivilizationCycle({ goal, tension }, state);

    return NextResponse.json({
      module: "agentic-civilization",
      externalExecution: false,
      run,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agentic civilization cycle failed" },
      { status: 500 }
    );
  }
}
