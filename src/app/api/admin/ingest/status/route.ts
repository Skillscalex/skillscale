import { NextResponse } from "next/server";
import { createIngestionStorage } from "@/ingestion/storage";

export async function GET() {
  try {
    const sources = await createIngestionStorage().listSources();
    return NextResponse.json({
      ok: true,
      sources,
      note: "Detailed run status is stored in crawl_runs/crawl_errors in Supabase or .ingestion-cache/local-store.json for local fallback.",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load ingestion status" }, { status: 500 });
  }
}
