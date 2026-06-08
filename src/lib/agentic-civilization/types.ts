export type CyclePhase =
  | "sense"
  | "frame"
  | "diverge"
  | "score"
  | "route"
  | "act"
  | "critique"
  | "govern"
  | "execute"
  | "observe"
  | "remember"
  | "evolve";

export type AgentRole =
  | "scout"
  | "framer"
  | "diverger"
  | "scorer"
  | "router"
  | "actor"
  | "critic"
  | "governor"
  | "observer"
  | "memory"
  | "evolver";

export type AgentPassport = {
  id: string;
  name: string;
  role: AgentRole;
  charter: string;
  skills: string[];
  diversityVector: string[];
  reputation: number;
};

export type AgentReputation = {
  agentId: string;
  karma: number;
  reliability: number;
  lastDelta: number;
};

export type TrustedDelta = {
  id: string;
  sourceAgentId: string;
  phase: CyclePhase;
  claim: string;
  confidence: number;
  trust: number;
  evidence: string[];
};

export type UtilityCandidate = {
  id: string;
  title: string;
  originatingAgentId: string;
  summary: string;
  intendedDeltaIds: string[];
  diversityTags: string[];
  simulatedAction: string;
};

export type UtilityScore = {
  candidateId: string;
  usefulness: number;
  reversibility: number;
  risk: number;
  novelty: number;
  diversity: number;
  total: number;
};

export type GovernanceDecision = {
  candidateId: string;
  decision: "approve_simulation" | "revise" | "reject";
  rationale: string;
  constraints: string[];
};

export type MemoryRecord = {
  id: string;
  cycleId: string;
  agentId: string;
  note: string;
  karmaDelta: number;
  tags: string[];
};

export type EvolutionEvent = {
  id: string;
  type: "new_norm" | "agent_training" | "route_adjustment" | "diversity_gap";
  description: string;
  priority: "low" | "medium" | "high";
};

export type CouncilView = {
  alignment: number;
  dissent: string[];
  approvedCandidateIds: string[];
  riskRegister: string[];
  nextQuestions: string[];
};

export type CivilizationState = {
  id: string;
  name: string;
  goal: string;
  cycle: number;
  agents: AgentPassport[];
  reputations: AgentReputation[];
  memory: MemoryRecord[];
};

export type CycleRun = {
  id: string;
  state: CivilizationState;
  phases: CyclePhase[];
  trustedDeltas: TrustedDelta[];
  candidates: UtilityCandidate[];
  scores: UtilityScore[];
  route: string[];
  simulatedActions: string[];
  critiques: string[];
  governance: GovernanceDecision[];
  observations: string[];
  memoryRecords: MemoryRecord[];
  evolution: EvolutionEvent[];
  council: CouncilView;
};

export type CycleInput = {
  goal?: string;
  tension?: string;
};
