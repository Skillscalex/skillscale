export async function robotsAllowed(targetUrl: string, userAgent = "SkillscaleBot"): Promise<{ allowed: boolean; checkedAt: string; reason: string }> {
  const checkedAt = new Date().toISOString();
  try {
    const url = new URL(targetUrl);
    const res = await fetch(`${url.origin}/robots.txt`, { headers: { "User-Agent": userAgent } });
    if (!res.ok) return { allowed: true, checkedAt, reason: "robots.txt unavailable" };
    const text = await res.text();
    const groups = text.split(/\n(?=User-agent:)/i);
    const relevant = groups.find((group) => new RegExp(`User-agent:\\s*(\\*|${userAgent})`, "i").test(group));
    if (!relevant) return { allowed: true, checkedAt, reason: "no matching robots group" };
    const path = url.pathname;
    for (const line of relevant.split(/\r?\n/)) {
      const match = line.match(/^\s*Disallow:\s*(\S*)/i);
      if (match?.[1] && path.startsWith(match[1])) {
        return { allowed: false, checkedAt, reason: `disallowed by ${match[1]}` };
      }
    }
    return { allowed: true, checkedAt, reason: "allowed by robots.txt" };
  } catch (error) {
    return { allowed: true, checkedAt, reason: error instanceof Error ? error.message : "robots check failed" };
  }
}
