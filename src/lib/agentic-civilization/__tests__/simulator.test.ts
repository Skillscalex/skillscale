import assert from "node:assert/strict";
import { createInitialCivilizationState, runCivilizationCycle } from "../simulator";

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

await test("cycle produces every required civilization artifact", () => {
  const run = runCivilizationCycle({
    goal: "Coordinate a simulated agentic civilization module",
    tension: "How do we preserve diversity before convergence?",
  });

  assert.deepEqual(run.phases, [
    "sense",
    "frame",
    "diverge",
    "score",
    "route",
    "act",
    "critique",
    "govern",
    "execute",
    "observe",
    "remember",
    "evolve",
  ]);
  assert.ok(run.state.agents.length >= 5);
  assert.ok(run.trustedDeltas.length >= 4);
  assert.ok(run.candidates.length >= 3);
  assert.equal(run.scores.length, run.candidates.length);
  assert.ok(run.governance.length >= 1);
  assert.ok(run.memoryRecords.length >= 1);
  assert.ok(run.evolution.length >= 1);
  assert.ok(run.council.nextQuestions.length >= 1);
});

await test("cycle remains simulated and updates memory karma", () => {
  const state = createInitialCivilizationState({ goal: "Keep execution mock-only" });
  const run = runCivilizationCycle({}, state);

  assert.ok(run.simulatedActions.every((action) => action.startsWith("SIMULATED ONLY:")));
  assert.ok(run.governance.every((decision) => decision.constraints.includes("no external execution")));
  assert.ok(run.memoryRecords.some((record) => record.karmaDelta !== 0));
  assert.ok(run.state.reputations.some((reputation) => reputation.lastDelta !== 0));
});
