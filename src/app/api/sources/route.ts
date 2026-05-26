import { NextResponse } from "next/server";
import { createIngestionStorage } from "@/ingestion/storage";

export async function GET() {
  try {
    const data = await createIngestionStorage().listSources();
    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to list sources" }, { status: 500 });
  }
}
