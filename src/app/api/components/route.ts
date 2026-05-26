import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createIngestionStorage } from "@/ingestion/storage";

const QuerySchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  source: z.string().optional(),
  sort: z.enum(["relevance", "newest", "install_count", "stars", "last_updated"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(48),
  offset: z.coerce.number().min(0).default(0),
});

export async function GET(req: NextRequest) {
  try {
    const params = QuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const storage = createIngestionStorage();
    const result = await storage.listComponents(params as never);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to list components" }, { status: 500 });
  }
}
