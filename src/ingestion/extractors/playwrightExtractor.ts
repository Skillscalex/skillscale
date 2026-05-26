import type { RawSourceItem } from "../types";

export async function extractWithPlaywrightFallback(): Promise<RawSourceItem[]> {
  throw new Error("Playwright extraction is intentionally optional and not installed in this MVP");
}
