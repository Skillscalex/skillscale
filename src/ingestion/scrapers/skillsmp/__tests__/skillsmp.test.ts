import assert from "node:assert/strict";

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}:`, e);
    process.exitCode = 1;
  }
}

// ── Rate Limiter ─────────────────────────────────────────────────
import { TokenBucket } from "../rateLimit";

console.log("\nRate Limiter");

await test("acquires immediately when tokens available", async () => {
  const bucket = new TokenBucket(10, 3);
  const start = Date.now();
  await bucket.acquire();
  assert.ok(Date.now() - start < 50, "should be instant");
});

await test("throttles to ratePerSec", async () => {
  const bucket = new TokenBucket(10, 1); // 10/sec, burst 1
  await bucket.acquire(); // burns the 1 token
  const start = Date.now();
  await bucket.acquire(); // must wait ~100ms for 1 new token at 10/sec
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 80, `expected >=80ms wait, got ${elapsed}ms`);
});

await test("pause drains tokens and blocks acquire", async () => {
  const bucket = new TokenBucket(100, 3);
  const pauseMs = 200;
  const start = Date.now();
  const pausePromise = bucket.pause(pauseMs);
  // acquire should wait until pause is done
  await Promise.all([pausePromise, bucket.acquire()]);
  assert.ok(Date.now() - start >= pauseMs - 20);
});
