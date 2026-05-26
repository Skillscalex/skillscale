export class RateLimiter {
  private nextAt = 0;
  private readonly intervalMs: number;

  constructor(requestsPerMinute: number) {
    this.intervalMs = Math.max(50, Math.ceil(60_000 / Math.max(1, requestsPerMinute)));
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const delay = Math.max(0, this.nextAt - now);
    this.nextAt = Math.max(now, this.nextAt) + this.intervalMs;
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
