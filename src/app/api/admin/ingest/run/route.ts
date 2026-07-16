import { NextRequest, NextResponse } from "next/server";
import { runIngestion } from "@/ingestion";

function authorized(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") return true;
  const authorization = req.headers.get("authorization");
  const adminToken = process.env.INGEST_ADMIN_TOKEN;
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(
    (adminToken && authorization === `Bearer ${adminToken}`) ||
    (cronSecret && authorization === `Bearer ${cronSecret}`)
  );
}

async function runAuthorizedIngestion(req: NextRequest, options?: { cron?: boolean }) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = options?.cron ? {} : await req.json().catch(() => ({}));
    const result = await runIngestion({
      source: typeof body.source === "string" ? body.source : undefined,
      dryRun: Boolean(body.dryRun),
      resume: options?.cron ? true : Boolean(body.resume),
    });
    return NextResponse.json({ ok: true, cron: Boolean(options?.cron), ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ingestion failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return runAuthorizedIngestion(req);
}

export async function GET(req: NextRequest) {
  return runAuthorizedIngestion(req, { cron: true });
}
