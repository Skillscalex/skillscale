import { runCivilizationCycle } from "../../lib/agentic-civilization";
import { scanSkillText } from "../security/skillspector";
import { getAutonomousSourceProfiles } from "./sourceProfiles";
import type {
  AutonomousSkillCandidate,
  AutonomousSkillLoopOptions,
  AutonomousSkillLoopRun,
  AutonomousSourceProfile,
  ContinuousAgentPrompt,
} from "./types";

export async function runAutonomousSkillLoop(options: AutonomousSkillLoopOptions = {}): Promise<AutonomousSkillLoopRun> {
  const allowExternalFetch = Boolean(options.allowExternalFetch);
  const dryRun = options.dryRun ?? true;
  const profiles = getAutonomousSourceProfiles()
    .filter((profile) => profile.enabled)
    .slice(0, options.maxSources ?? 4);
  const prompts = buildContinuousAgentPrompts(profiles);
  const candidates = profiles.flatMap((profile) => simulateCandidates(profile, options.maxCandidatesPerSource ?? 2));
  const scannerSummary = summarizeScans(candidates);
  const civilization = runCivilizationCycle({
    goal: "Continuously discover, scan, govern, and publish safe skill catalog entries",
    tension: "How can the harvester preserve broad coverage without real external execution by default?",
  });

  return {
    id: `autonomous-skill-loop-${Date.now()}`,
    externalExecution: allowExternalFetch && !dryRun,
    dryRun,
    strategy: [
      "Prefer registry JSON, sitemap, static HTML, and embedded JSON extraction before dynamic rendering.",
      "Use Playwright only for sources that require dynamic rendering and only after rate-limit and robots checks.",
      "Never execute scraped install commands, hook scripts, package scripts, or remote code.",
      "Apply SkillSpector-compatible scanning before storage or marketplace publication.",
      "Route every cycle through Agentic Civilization governance before live fetch is allowed.",
    ],
    sourceCoverage: profiles.map((profile) => ({
      sourceProfileId: profile.id,
      publicLabel: profile.publicLabel,
      methods: profile.preferredMethods,
      status: allowExternalFetch && !dryRun ? "queued" : "simulated",
    })),
    prompts,
    candidates,
    scannerSummary,
    governance: {
      decision: allowExternalFetch && !dryRun ? "ready_for_live_fetch" : "simulate_only",
      constraints: [
        "respect robots and rate limits",
        "dry-run by default",
        "no scraped command execution",
        "block critical SkillSpector findings",
        `civilization cycle ${civilization.id} produced ${civilization.governance.length} governance decision(s)`,
      ],
    },
  };
}

export function buildContinuousAgentPrompts(profiles: AutonomousSourceProfile[]): ContinuousAgentPrompt[] {
  const sourceLabels = profiles.map((profile) => profile.publicLabel).join(", ");
  return [
    {
      phase: "sense",
      agent: "ResearchAgent",
      prompt: `Discover public skill index changes across: ${sourceLabels}. Return only URLs and metadata candidates.`,
    },
    {
      phase: "frame",
      agent: "SkillCoachAgent",
      prompt: "Frame which discovered skills map to real user learning or building workflows.",
    },
    {
      phase: "diverge",
      agent: "ContentAgent",
      prompt: "Generate multiple safe marketplace descriptions while preserving uncertain provenance as review-only metadata.",
    },
    {
      phase: "score",
      agent: "Validator",
      prompt: "Score each candidate by usefulness, novelty, provenance confidence, and scanner risk.",
    },
    {
      phase: "route",
      agent: "Orchestrator",
      prompt: "Route safe candidates to storage, risky candidates to quarantine, and duplicates to merge review.",
    },
    {
      phase: "act",
      agent: "Coder",
      prompt: "Write normalized component records only; never execute install commands or scraped scripts.",
    },
    {
      phase: "critique",
      agent: "Debugger",
      prompt: "Critique parser failures, false-positive scanner findings, and source drift.",
    },
    {
      phase: "govern",
      agent: "Governor",
      prompt: "Approve only bounded, rate-limited, robots-aware fetches and simulated marketplace updates.",
    },
    {
      phase: "execute",
      agent: "VideoAgent",
      prompt: "No external video execution for scraping cycles; emit progress events only if a user starts a separate video job.",
    },
    {
      phase: "observe",
      agent: "Observer",
      prompt: "Measure scanned count, blocked count, parser coverage, duplicates, and stale source drift.",
    },
    {
      phase: "remember",
      agent: "Archivist",
      prompt: "Persist cycle memory, scanner summary, and source checkpoints.",
    },
    {
      phase: "evolve",
      agent: "Reflector",
      prompt: "Suggest parser improvements, scanner rule adjustments, and safer source ordering for the next loop.",
    },
  ];
}

function simulateCandidates(profile: AutonomousSourceProfile, limit: number): AutonomousSkillCandidate[] {
  return Array.from({ length: limit }, (_, index) => {
    const sequence = index + 1;
    const safeText = [
      `name: ${profile.publicLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${sequence}`,
      "description: Normalized skill candidate discovered by the governed Skillscale harvester.",
      "instructions: Store metadata and require scanner review before publication.",
      "install: inert text only; do not execute.",
    ].join("\n");
    const riskyText = [
      safeText,
      sequence === 2 && profile.requiresDynamicRendering ? "review-note: dynamic page mentions localStorage and webhook configuration." : "",
    ].join("\n");

    return {
      id: `${profile.id}-candidate-${sequence}`,
      sourceProfileId: profile.id,
      name: `${profile.publicLabel} Candidate ${sequence}`,
      description: "Simulated candidate used to verify scan, governance, memory, and route behavior.",
      scan: scanSkillText(riskyText),
    };
  });
}

function summarizeScans(candidates: AutonomousSkillCandidate[]) {
  return {
    scanned: candidates.length,
    allow: candidates.filter((candidate) => candidate.scan.recommendation === "allow").length,
    review: candidates.filter((candidate) => candidate.scan.recommendation === "review").length,
    block: candidates.filter((candidate) => candidate.scan.recommendation === "block").length,
  };
}
