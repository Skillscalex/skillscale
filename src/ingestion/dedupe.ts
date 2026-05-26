import type { DuplicateCandidate, NormalizedComponent } from "./types";

export function duplicateSignals(items: NormalizedComponent[]): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];
  const seen = new Map<string, NormalizedComponent>();

  function check(key: string | undefined, item: NormalizedComponent, reason: string, confidence: number) {
    if (!key) return;
    const normalizedKey = key.toLowerCase().trim();
    const prev = seen.get(`${reason}:${normalizedKey}`);
    if (prev && prev.canonicalSlug !== item.canonicalSlug) {
      candidates.push({ leftSlug: prev.canonicalSlug, rightSlug: item.canonicalSlug, reason, confidence });
    } else {
      seen.set(`${reason}:${normalizedKey}`, item);
    }
  }

  for (const item of items) {
    check(item.sourceUrls[0], item, "canonical_url", 0.99);
    check(item.githubUrl, item, "github_url", 0.98);
    check(item.installCommand, item, "install_command", 0.94);
    check(`${item.name}:${item.authorName ?? ""}`, item, "name_author", 0.86);
    check(`${item.name}:${item.marketplaceName ?? ""}:${item.componentType}`, item, "name_marketplace_type", 0.82);
  }

  return candidates;
}
