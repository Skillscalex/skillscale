import type { PagesSkill } from "./pagesCatalog";

type GroupSeed = {
  readonly id: string;
  readonly label: string;
  readonly domains: readonly string[];
  readonly workflows: readonly string[];
};

const GENERATED_AT = "2026-06-29T00:00:00Z";
const ACTIONS = [
  "planner",
  "assistant",
  "reviewer",
  "summarizer",
  "copilot",
  "auditor",
  "generator",
  "tracker",
  "optimizer",
  "reporter",
  "triage",
  "playbook",
] as const;

const GROUP_SEEDS: readonly GroupSeed[] = [
  {
    id: "02",
    label: "business and financial operations",
    domains: ["finance", "operations", "strategy", "procurement"],
    workflows: ["forecast modeling", "variance analysis", "board reporting", "budget planning"],
  },
  {
    id: "03",
    label: "arts, design, entertainment, sports, and media",
    domains: ["creative", "media", "brand", "production", "content", "sports"],
    workflows: ["campaign concepting", "shot lists", "creative briefs", "asset QA", "publishing calendars", "coverage recaps"],
  },
  {
    id: "04",
    label: "office and administrative support",
    domains: ["office", "admin", "records", "executive-assistant"],
    workflows: ["inbox triage", "document formatting", "calendar planning", "travel briefs"],
  },
  {
    id: "05",
    label: "legal",
    domains: ["legal", "contract", "compliance", "paralegal"],
    workflows: ["clause review", "matter summaries", "brief drafting", "regulatory checks"],
  },
  {
    id: "06",
    label: "life, physical, and social science",
    domains: ["science", "lab", "research", "field-study"],
    workflows: ["literature synthesis", "method review", "data cleaning", "experiment planning"],
  },
  {
    id: "07",
    label: "educational instruction and library",
    domains: ["teaching", "curriculum", "library", "student-support"],
    workflows: ["lesson planning", "rubric creation", "quiz generation", "IEP support"],
  },
  {
    id: "08",
    label: "management",
    domains: ["management", "leadership", "program", "people-ops"],
    workflows: ["OKR planning", "status reports", "decision logs", "hiring scorecards"],
  },
  {
    id: "09",
    label: "sales and related",
    domains: ["sales", "customer", "account", "retail"],
    workflows: ["lead research", "proposal writing", "call summaries", "CRM updates"],
  },
  {
    id: "10",
    label: "architecture and engineering",
    domains: ["architecture", "engineering", "mechanical", "civil"],
    workflows: ["requirements capture", "design review", "BOM drafting", "spec checks"],
  },
  {
    id: "11",
    label: "healthcare practitioners and technical",
    domains: ["clinical", "medical", "nursing", "pharmacy"],
    workflows: ["SOAP notes", "patient education", "coding support", "chart summaries"],
  },
  {
    id: "12",
    label: "personal care and service",
    domains: ["personal-care", "wellness", "client-service", "fitness"],
    workflows: ["intake summaries", "wellness plans", "appointment follow-up", "service scripts"],
  },
  {
    id: "13",
    label: "community and social service",
    domains: ["community", "social-service", "casework", "nonprofit"],
    workflows: ["case notes", "resource matching", "grant drafts", "impact reports"],
  },
  {
    id: "14",
    label: "military specific",
    domains: ["military", "defense", "readiness", "logistics"],
    workflows: ["briefing packs", "after-action reports", "readiness checks", "SITREP drafts"],
  },
  {
    id: "15",
    label: "food preparation and serving related",
    domains: ["food-service", "restaurant", "kitchen", "catering"],
    workflows: ["menu costing", "prep lists", "allergen labels", "inventory checks"],
  },
  {
    id: "16",
    label: "transportation and material moving",
    domains: ["transportation", "logistics", "dispatch", "warehouse"],
    workflows: ["route planning", "freight quotes", "load matching", "delivery exceptions"],
  },
  {
    id: "17",
    label: "healthcare support",
    domains: ["healthcare-support", "clinic-ops", "patient-access", "care-aide"],
    workflows: ["appointment scheduling", "intake prep", "shift coverage", "discharge instructions"],
  },
  {
    id: "18",
    label: "protective service",
    domains: ["protective-service", "security", "emergency", "inspection"],
    workflows: ["incident reports", "threat summaries", "patrol logs", "compliance checks"],
  },
  {
    id: "19",
    label: "farming, fishing, and forestry",
    domains: ["farming", "forestry", "fishery", "agronomy"],
    workflows: ["crop plans", "harvest forecasts", "soil notes", "equipment logs"],
  },
  {
    id: "20",
    label: "construction and extraction",
    domains: ["construction", "trades", "site-ops", "estimation"],
    workflows: ["RFI drafts", "material takeoffs", "change orders", "safety talks"],
  },
  {
    id: "21",
    label: "production",
    domains: ["production", "manufacturing", "quality", "plant-ops"],
    workflows: ["SOP writing", "quality checks", "line handoffs", "root cause analysis"],
  },
  {
    id: "22",
    label: "installation, maintenance, and repair",
    domains: ["installation", "maintenance", "repair", "field-service"],
    workflows: ["work orders", "diagnostic flows", "parts lists", "service notes"],
  },
  {
    id: "23",
    label: "building and grounds cleaning and maintenance",
    domains: ["facilities", "grounds", "cleaning", "janitorial"],
    workflows: ["inspection reports", "cleaning schedules", "supply checks", "issue triage"],
  },
];

export function buildMarketSeedSkills(): readonly PagesSkill[] {
  return GROUP_SEEDS.flatMap((group) => buildGroupSeeds(group, 48));
}

function buildGroupSeeds(group: GroupSeed, count: number): PagesSkill[] {
  const skills: PagesSkill[] = [];
  for (let index = 0; index < count; index += 1) {
    const domain = group.domains[index % group.domains.length];
    const workflow = group.workflows[Math.floor(index / group.domains.length) % group.workflows.length];
    const action = ACTIONS[Math.floor(index / (group.domains.length * group.workflows.length)) % ACTIONS.length];
    const idNumber = String(index + 1).padStart(3, "0");
    const skillName = slugify(`${domain}-${workflow}-${action}`);
    const secureScore = 82 + ((index + Number(group.id)) % 14);
    skills.push({
      id: `market-${group.id}-${idNumber}`,
      name: skillName,
      author: "skillscale-market",
      stars: Math.max(24, 275 - Number(group.id) - index * 3),
      description: `Marketplace-ready ${domain.replace(/-/g, " ")} skill for ${workflow}. Produces structured checklists, drafts, summaries, and handoff notes tuned for ${group.label} teams.`,
      tags: [slugify(domain), slugify(workflow), "workflow", "marketplace"],
      updatedAt: epochSeconds(GENERATED_AT),
      occupationId: group.id,
      source: "skillscale-market-seed",
      secureScore,
      auditStatus: secureScore >= 85 ? "approved" : "needs_review",
    });
  }
  return skills;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function epochSeconds(value: string): string {
  return String(Math.floor(Date.parse(value) / 1000));
}
