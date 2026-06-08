import type {
  AgentPassport,
  AgentReputation,
  CivilizationState,
  CycleInput,
  CyclePhase,
  CycleRun,
  EvolutionEvent,
  GovernanceDecision,
  MemoryRecord,
  TrustedDelta,
  UtilityCandidate,
  UtilityScore,
} from "./types";

const PHASES: CyclePhase[] = [
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
];

const DEFAULT_GOAL = "Improve SkillScale coordination without external execution";

export function createInitialCivilizationState(input: CycleInput = {}): CivilizationState {
  const goal = input.goal?.trim() || DEFAULT_GOAL;
  const agents: AgentPassport[] = [
    {
      id: "agent-scout",
      name: "Scout",
      role: "scout",
      charter: "Sense weak signals and preserve raw observations before synthesis.",
      skills: ["sensing", "source hygiene", "uncertainty marking"],
      diversityVector: ["empirical", "early-warning"],
      reputation: 0.72,
    },
    {
      id: "agent-framer",
      name: "Framekeeper",
      role: "framer",
      charter: "Turn signals into explicit tensions, assumptions, and system boundaries.",
      skills: ["problem framing", "boundary setting", "tradeoff mapping"],
      diversityVector: ["systems", "constraint-led"],
      reputation: 0.78,
    },
    {
      id: "agent-diverger",
      name: "Diverger",
      role: "diverger",
      charter: "Generate varied candidate moves before convergence pressure appears.",
      skills: ["ideation", "counterfactuals", "option design"],
      diversityVector: ["creative", "minority-report"],
      reputation: 0.69,
    },
    {
      id: "agent-governor",
      name: "Governor",
      role: "governor",
      charter: "Approve only bounded, reversible, simulated actions.",
      skills: ["policy checks", "risk limits", "reversibility"],
      diversityVector: ["safety", "governance"],
      reputation: 0.84,
    },
    {
      id: "agent-memory",
      name: "Archivist",
      role: "memory",
      charter: "Convert outcomes into karma, memory, and future route adjustments.",
      skills: ["memory", "karma accounting", "learning loops"],
      diversityVector: ["long-horizon", "continuity"],
      reputation: 0.75,
    },
  ];

  return {
    id: "civilization-skillscale-lab",
    name: "SkillScale Agentic Civilization Lab",
    goal,
    cycle: 0,
    agents,
    reputations: agents.map(agentToReputation),
    memory: [],
  };
}

export function runCivilizationCycle(
  input: CycleInput = {},
  state = createInitialCivilizationState(input)
): CycleRun {
  const cycleId = `cycle-${state.cycle + 1}`;
  const tension = input.tension?.trim() || "How can agents improve outcomes while staying simulated and governed?";
  const trustedDeltas = buildTrustedDeltas(cycleId, state, tension);
  const candidates = buildUtilityCandidates(state, trustedDeltas);
  const scores = candidates.map((candidate) => scoreCandidate(candidate, trustedDeltas));
  const route = scores
    .filter((score) => score.total >= 0.62)
    .sort((a, b) => b.total - a.total)
    .map((score) => score.candidateId);
  const simulatedActions = route.map((candidateId) => {
    const candidate = candidates.find((item) => item.id === candidateId);
    return candidate ? `SIMULATED ONLY: ${candidate.simulatedAction}` : `SIMULATED ONLY: missing ${candidateId}`;
  });
  const critiques = buildCritiques(scores, candidates);
  const governance = buildGovernance(scores, candidates, critiques);
  const observations = buildObservations(governance, trustedDeltas);
  const memoryRecords = buildMemoryRecords(cycleId, state, governance);
  const reputations = updateReputations(state.reputations, memoryRecords);
  const evolution = buildEvolution(governance, scores, trustedDeltas);
  const nextState: CivilizationState = {
    ...state,
    cycle: state.cycle + 1,
    reputations,
    memory: [...state.memory, ...memoryRecords],
  };

  return {
    id: cycleId,
    state: nextState,
    phases: PHASES,
    trustedDeltas,
    candidates,
    scores,
    route,
    simulatedActions,
    critiques,
    governance,
    observations,
    memoryRecords,
    evolution,
    council: {
      alignment: average(governance.map((decision) => decision.decision === "approve_simulation" ? 0.86 : 0.54)),
      dissent: critiques.filter((critique) => critique.includes("diversity") || critique.includes("risk")),
      approvedCandidateIds: governance.filter((decision) => decision.decision === "approve_simulation").map((decision) => decision.candidateId),
      riskRegister: governance.flatMap((decision) => decision.constraints),
      nextQuestions: [
        "Which minority signal should be protected for one more cycle?",
        "What would make the top route reversible enough to simulate again?",
        "Which memory update changed agent reputation most?",
      ],
    },
  };
}

function agentToReputation(agent: AgentPassport): AgentReputation {
  return {
    agentId: agent.id,
    karma: Math.round(agent.reputation * 100),
    reliability: agent.reputation,
    lastDelta: 0,
  };
}

function buildTrustedDeltas(cycleId: string, state: CivilizationState, tension: string): TrustedDelta[] {
  const [scout, framer, diverger, governor] = state.agents;
  return [
    {
      id: `${cycleId}-delta-sense`,
      sourceAgentId: scout.id,
      phase: "sense",
      claim: `Goal pressure detected: ${state.goal}`,
      confidence: 0.82,
      trust: 0.78,
      evidence: ["input goal", "bounded module rule", "mock execution policy"],
    },
    {
      id: `${cycleId}-delta-frame`,
      sourceAgentId: framer.id,
      phase: "frame",
      claim: tension,
      confidence: 0.76,
      trust: 0.8,
      evidence: ["civilization charter", "cycle boundary", "UI/core separation"],
    },
    {
      id: `${cycleId}-delta-diverge`,
      sourceAgentId: diverger.id,
      phase: "diverge",
      claim: "Keep at least three candidates alive until after scoring.",
      confidence: 0.88,
      trust: 0.73,
      evidence: ["diversity before convergence rule", "candidate diversity tags"],
    },
    {
      id: `${cycleId}-delta-govern`,
      sourceAgentId: governor.id,
      phase: "govern",
      claim: "All actions must remain simulated and reversible.",
      confidence: 0.94,
      trust: 0.9,
      evidence: ["module instruction", "execution guardrail", "route constraints"],
    },
  ];
}

function buildUtilityCandidates(state: CivilizationState, deltas: TrustedDelta[]): UtilityCandidate[] {
  const allDeltaIds = deltas.map((delta) => delta.id);
  return [
    {
      id: "candidate-council-snapshot",
      title: "Council Snapshot",
      originatingAgentId: "agent-framer",
      summary: "Summarize the current cycle into a council view with dissent preserved.",
      intendedDeltaIds: allDeltaIds,
      diversityTags: ["governance", "transparency", "dissent"],
      simulatedAction: `Render a council snapshot for "${state.goal}" using current trusted deltas.`,
    },
    {
      id: "candidate-reputation-shift",
      title: "Memory Karma Update",
      originatingAgentId: "agent-memory",
      summary: "Update agent karma from approved simulated contributions and critique outcomes.",
      intendedDeltaIds: [allDeltaIds[0], allDeltaIds[3]],
      diversityTags: ["memory", "accountability", "long-horizon"],
      simulatedAction: "Apply in-memory karma changes and produce no persistent external side effects.",
    },
    {
      id: "candidate-minority-route",
      title: "Protected Minority Route",
      originatingAgentId: "agent-diverger",
      summary: "Route one lower-consensus option forward to preserve exploration.",
      intendedDeltaIds: [allDeltaIds[1], allDeltaIds[2]],
      diversityTags: ["exploration", "minority-report", "novelty"],
      simulatedAction: "Keep the minority route visible for the next cycle without executing it externally.",
    },
  ];
}

function scoreCandidate(candidate: UtilityCandidate, deltas: TrustedDelta[]): UtilityScore {
  const support = candidate.intendedDeltaIds
    .map((id) => deltas.find((delta) => delta.id === id))
    .filter((delta): delta is TrustedDelta => Boolean(delta));
  const trust = average(support.map((delta) => delta.trust));
  const diversity = Math.min(1, candidate.diversityTags.length / 4);
  const novelty = candidate.diversityTags.includes("minority-report") ? 0.86 : 0.64;
  const risk = candidate.id.includes("minority") ? 0.32 : 0.18;
  const usefulness = Math.min(1, trust * 0.72 + support.length * 0.08);
  const reversibility = 0.95;
  const total = usefulness * 0.36 + reversibility * 0.22 + novelty * 0.16 + diversity * 0.16 - risk * 0.1;

  return {
    candidateId: candidate.id,
    usefulness: round(usefulness),
    reversibility,
    risk,
    novelty,
    diversity: round(diversity),
    total: round(total),
  };
}

function buildCritiques(scores: UtilityScore[], candidates: UtilityCandidate[]) {
  return scores.map((score) => {
    const candidate = candidates.find((item) => item.id === score.candidateId);
    const title = candidate?.title ?? score.candidateId;
    if (score.risk > 0.3) return `${title}: preserve diversity, but require explicit simulation label and no external execution.`;
    if (score.diversity < 0.65) return `${title}: useful route, but diversity coverage is thin.`;
    return `${title}: acceptable for simulated execution with normal governance logging.`;
  });
}

function buildGovernance(
  scores: UtilityScore[],
  candidates: UtilityCandidate[],
  critiques: string[]
): GovernanceDecision[] {
  return scores.map((score, index) => {
    const candidate = candidates.find((item) => item.id === score.candidateId);
    const constraints = ["no external execution", "mock behavior only", "record memory and governance output"];
    if (score.total < 0.58) {
      return {
        candidateId: score.candidateId,
        decision: "revise",
        rationale: `${candidate?.title ?? score.candidateId} needs stronger utility before simulation. ${critiques[index]}`,
        constraints,
      };
    }

    return {
      candidateId: score.candidateId,
      decision: "approve_simulation",
      rationale: `${candidate?.title ?? score.candidateId} is bounded, reversible, and useful enough to simulate.`,
      constraints,
    };
  });
}

function buildObservations(governance: GovernanceDecision[], deltas: TrustedDelta[]) {
  const approved = governance.filter((decision) => decision.decision === "approve_simulation").length;
  return [
    `${approved} simulated route(s) approved; no external calls or side effects performed.`,
    `${deltas.length} trusted delta(s) retained as evidence for council review.`,
    "Dissent remains visible through critique and next-question prompts.",
  ];
}

function buildMemoryRecords(cycleId: string, state: CivilizationState, governance: GovernanceDecision[]): MemoryRecord[] {
  return governance.map((decision, index) => {
    const candidateOwner = decision.candidateId.includes("reputation")
      ? "agent-memory"
      : decision.candidateId.includes("minority")
        ? "agent-diverger"
        : "agent-framer";
    return {
      id: `${cycleId}-memory-${index + 1}`,
      cycleId,
      agentId: candidateOwner,
      note: `${decision.decision}: ${decision.rationale}`,
      karmaDelta: decision.decision === "approve_simulation" ? 3 : -1,
      tags: [state.goal, decision.decision, "simulated"],
    };
  });
}

function updateReputations(reputations: AgentReputation[], records: MemoryRecord[]) {
  return reputations.map((reputation) => {
    const delta = records
      .filter((record) => record.agentId === reputation.agentId)
      .reduce((sum, record) => sum + record.karmaDelta, 0);
    const karma = reputation.karma + delta;
    return {
      ...reputation,
      karma,
      lastDelta: delta,
      reliability: round(Math.max(0.1, Math.min(0.99, karma / 100))),
    };
  });
}

function buildEvolution(
  governance: GovernanceDecision[],
  scores: UtilityScore[],
  deltas: TrustedDelta[]
): EvolutionEvent[] {
  const lowestDiversity = Math.min(...scores.map((score) => score.diversity));
  const revised = governance.some((decision) => decision.decision !== "approve_simulation");
  const averageTrust = average(deltas.map((delta) => delta.trust));

  return [
    {
      id: "evolve-simulation-norm",
      type: "new_norm",
      description: "Keep simulated execution labels in every action string.",
      priority: "high",
    },
    {
      id: "evolve-diversity-watch",
      type: lowestDiversity < 0.75 ? "diversity_gap" : "route_adjustment",
      description: lowestDiversity < 0.75
        ? "Add another divergent candidate before convergence in the next cycle."
        : "Current route diversity is healthy enough for the next cycle.",
      priority: lowestDiversity < 0.75 ? "medium" : "low",
    },
    {
      id: "evolve-trust-calibration",
      type: revised || averageTrust < 0.78 ? "agent_training" : "route_adjustment",
      description: "Tune scoring weights using governance outcomes and trusted-delta confidence.",
      priority: revised || averageTrust < 0.78 ? "medium" : "low",
    },
  ];
}

function average(values: number[]) {
  if (!values.length) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
