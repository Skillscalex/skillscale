"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  BrainCircuit,
  GitBranch,
  Landmark,
  Network,
  Play,
  RotateCcw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { CycleRun } from "@/lib/agentic-civilization";
import type { AutonomousSkillLoopRun } from "@/ingestion/autonomous";

type ApiResponse = {
  module: string;
  externalExecution: false;
  run: CycleRun;
};

type SkillLoopApiResponse = {
  module: string;
  externalExecution: boolean;
  run: AutonomousSkillLoopRun;
};

const INITIAL_GOAL = "Improve SkillScale coordination without external execution";
const INITIAL_TENSION = "How can agents preserve diversity before convergence?";

function scorePercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function AgenticCivilizationPage() {
  const [goal, setGoal] = useState(INITIAL_GOAL);
  const [tension, setTension] = useState(INITIAL_TENSION);
  const [run, setRun] = useState<CycleRun | null>(null);
  const [skillLoopRun, setSkillLoopRun] = useState<AutonomousSkillLoopRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSkillLoop, setLoadingSkillLoop] = useState(false);
  const [error, setError] = useState("");

  const topScore = useMemo(() => {
    if (!run?.scores.length) return null;
    return [...run.scores].sort((a, b) => b.total - a.total)[0];
  }, [run]);

  async function runCycle(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/agentic-civilization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, tension }),
      });
      if (!response.ok) throw new Error(`Cycle API returned HTTP ${response.status}`);
      const payload = (await response.json()) as ApiResponse;
      setRun(payload.run);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run cycle");
    } finally {
      setLoading(false);
    }
  }

  async function runSkillLoop() {
    setLoadingSkillLoop(true);
    setError("");

    try {
      const response = await fetch("/api/agentic-civilization/skills-loop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ live: false, allowExternalFetch: false }),
      });
      if (!response.ok) throw new Error(`Skill loop API returned HTTP ${response.status}`);
      const payload = (await response.json()) as SkillLoopApiResponse;
      setSkillLoopRun(payload.run);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run skill loop");
    } finally {
      setLoadingSkillLoop(false);
    }
  }

  return (
    <main className="civilization-shell">
      <section className="civilization-hero">
        <div>
          <div className="civilization-kicker">
            <Sparkles size={16} />
            Agentic Civilization Lab
          </div>
          <h1>Sense to Evolve, Fully Simulated</h1>
          <p>
            A bounded SkillScale module that runs mock agent cycles, produces trusted deltas,
            routes candidates through governance, and turns outcomes into memory karma.
          </p>
        </div>
        <div className="civilization-guardrail">
          <ShieldCheck size={20} />
          <span>No external execution</span>
        </div>
      </section>

      <section className="civilization-console glass">
        <form onSubmit={runCycle} className="civilization-form">
          <label>
            Goal
            <textarea value={goal} onChange={(event) => setGoal(event.target.value)} rows={3} />
          </label>
          <label>
            Tension
            <textarea value={tension} onChange={(event) => setTension(event.target.value)} rows={3} />
          </label>
          <div className="civilization-actions">
            <button className="btn-primary" type="submit" disabled={loading || !goal.trim()}>
              {loading ? <RotateCcw size={17} className="studio-spin" /> : <Play size={17} />}
              Run Cycle
            </button>
            <button className="btn-secondary" type="button" disabled={loadingSkillLoop} onClick={runSkillLoop}>
              {loadingSkillLoop ? <RotateCcw size={17} className="studio-spin" /> : <ScanSearch size={17} />}
              Skill Loop
            </button>
          </div>
        </form>
        {error && <p className="civilization-error">{error}</p>}
      </section>

      {skillLoopRun && (
        <section className="civilization-results">
          <div className="civilization-strip">
            <div>
              <span>Loop Mode</span>
              <strong>{skillLoopRun.dryRun ? "Dry" : "Live"}</strong>
            </div>
            <div>
              <span>Scanned</span>
              <strong>{skillLoopRun.scannerSummary.scanned}</strong>
            </div>
            <div>
              <span>Review</span>
              <strong>{skillLoopRun.scannerSummary.review}</strong>
            </div>
            <div>
              <span>Blocked</span>
              <strong>{skillLoopRun.scannerSummary.block}</strong>
            </div>
          </div>

          <div className="civilization-grid">
            <article className="civilization-panel">
              <div className="civilization-panel-title"><ScanSearch size={18} /> Source Coverage</div>
              {skillLoopRun.sourceCoverage.map((source) => (
                <p key={source.sourceProfileId}>
                  <strong>{source.publicLabel}</strong> · {source.status} · {source.methods.join(", ")}
                </p>
              ))}
            </article>

            <article className="civilization-panel">
              <div className="civilization-panel-title"><ShieldCheck size={18} /> Scanner Gate</div>
              <p>Allowed: {skillLoopRun.scannerSummary.allow}</p>
              <p>Review: {skillLoopRun.scannerSummary.review}</p>
              <p>Blocked: {skillLoopRun.scannerSummary.block}</p>
            </article>

            <article className="civilization-panel wide">
              <div className="civilization-panel-title"><Landmark size={18} /> Loop Governance</div>
              <p>{skillLoopRun.governance.decision.replaceAll("_", " ")}</p>
              {skillLoopRun.governance.constraints.map((constraint) => (
                <small key={constraint}>{constraint}</small>
              ))}
            </article>
          </div>
        </section>
      )}

      {run ? (
        <section className="civilization-results">
          <div className="civilization-strip">
            <div>
              <span>Cycle</span>
              <strong>{run.state.cycle}</strong>
            </div>
            <div>
              <span>Agents</span>
              <strong>{run.state.agents.length}</strong>
            </div>
            <div>
              <span>Trusted Deltas</span>
              <strong>{run.trustedDeltas.length}</strong>
            </div>
            <div>
              <span>Top Utility</span>
              <strong>{topScore ? scorePercent(topScore.total) : "n/a"}</strong>
            </div>
          </div>

          <div className="civilization-grid">
            <article className="civilization-panel">
              <div className="civilization-panel-title"><Network size={18} /> Cycle Phases</div>
              <div className="phase-rail">
                {run.phases.map((phase) => <span key={phase}>{phase}</span>)}
              </div>
            </article>

            <article className="civilization-panel">
              <div className="civilization-panel-title"><GitBranch size={18} /> Route</div>
              {run.route.map((candidateId) => (
                <p key={candidateId}>{candidateId}</p>
              ))}
              {run.simulatedActions.map((action) => (
                <small key={action}>{action}</small>
              ))}
            </article>

            <article className="civilization-panel wide">
              <div className="civilization-panel-title"><Landmark size={18} /> Governance</div>
              <div className="governance-list">
                {run.governance.map((decision) => (
                  <div key={decision.candidateId}>
                    <strong>{decision.decision.replace("_", " ")}</strong>
                    <span>{decision.candidateId}</span>
                    <p>{decision.rationale}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="civilization-panel">
              <div className="civilization-panel-title"><BrainCircuit size={18} /> Council View</div>
              <p>Alignment: {scorePercent(run.council.alignment)}</p>
              {run.council.dissent.map((item) => <small key={item}>{item}</small>)}
            </article>

            <article className="civilization-panel">
              <div className="civilization-panel-title"><Sparkles size={18} /> Evolution</div>
              {run.evolution.map((event) => (
                <p key={event.id}><strong>{event.priority}</strong> {event.description}</p>
              ))}
            </article>
          </div>
        </section>
      ) : (
        <section className="civilization-empty">
          <p>Run a cycle to generate trusted deltas, governance decisions, memory records, and evolution suggestions.</p>
        </section>
      )}
    </main>
  );
}
