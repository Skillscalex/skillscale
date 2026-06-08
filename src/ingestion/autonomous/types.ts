import type { ExtractionMethod } from "../types";
import type { SkillSpectorScan } from "../security/skillspector";

export type AutonomousSourceProfile = {
  id: string;
  publicLabel: string;
  baseUrl: string;
  discoveryUrls: string[];
  preferredMethods: ExtractionMethod[];
  enabled: boolean;
  maxRequestsPerMinute: number;
  requiresDynamicRendering: boolean;
};

export type ContinuousAgentPrompt = {
  phase: "sense" | "frame" | "diverge" | "score" | "route" | "act" | "critique" | "govern" | "execute" | "observe" | "remember" | "evolve";
  agent: string;
  prompt: string;
};

export type AutonomousSkillCandidate = {
  id: string;
  sourceProfileId: string;
  name: string;
  description: string;
  scan: SkillSpectorScan;
};

export type AutonomousSkillLoopOptions = {
  allowExternalFetch?: boolean;
  dryRun?: boolean;
  maxSources?: number;
  maxCandidatesPerSource?: number;
};

export type AutonomousSkillLoopRun = {
  id: string;
  externalExecution: boolean;
  dryRun: boolean;
  strategy: string[];
  sourceCoverage: Array<{
    sourceProfileId: string;
    publicLabel: string;
    methods: ExtractionMethod[];
    status: "simulated" | "queued" | "skipped";
  }>;
  prompts: ContinuousAgentPrompt[];
  candidates: AutonomousSkillCandidate[];
  scannerSummary: {
    scanned: number;
    allow: number;
    review: number;
    block: number;
  };
  governance: {
    decision: "simulate_only" | "ready_for_live_fetch";
    constraints: string[];
  };
};
