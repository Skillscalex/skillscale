import { NextRequest, NextResponse } from "next/server";
import { runIngestion } from "@/ingestion";

function authorized(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") return true;
  const token = process.env.INGEST_ADMIN_TOKEN;
  return Boolean(token && req.headers.get("authorization") === `Bearer ${token}`);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({}));
    const result = await runIngestion({
      source: typeof body.source === "string" ? body.source : undefined,
      dryRun: Boolean(body.dryRun),
      resume: Boolean(body.resume),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ingestion failed" }, { status: 500 });
  }
}
