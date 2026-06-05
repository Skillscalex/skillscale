function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private paused = false;

  constructor(
    private readonly ratePerSec: number = 1,
    private readonly capacity: number = 3,
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    while (true) {
      if (this.paused) {
        await sleep(50);
        continue;
      }
      const now = Date.now();
      const elapsed = now - this.lastRefill;
      this.tokens = Math.min(
        this.capacity,
        this.tokens + (elapsed / 1000) * this.ratePerSec,
      );
      this.lastRefill = now;

      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const waitMs = Math.ceil(((1 - this.tokens) / this.ratePerSec) * 1000);
      await sleep(Math.max(waitMs, 10));
    }
  }

  async pause(ms: number): Promise<void> {
    this.paused = true;
    this.tokens = 0;
    await sleep(ms);
    this.paused = false;
  }
}
