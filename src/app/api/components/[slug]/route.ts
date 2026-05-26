import { NextRequest, NextResponse } from "next/server";
import { createIngestionStorage } from "@/ingestion/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const component = await createIngestionStorage().getComponent(slug);
    if (!component) return NextResponse.json({ error: "Component not found" }, { status: 404 });
    return NextResponse.json({ data: component });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load component" }, { status: 500 });
  }
}
