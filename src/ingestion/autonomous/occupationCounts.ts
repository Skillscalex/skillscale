import { readFile } from "node:fs/promises";

export type OccupationCount = {
  readonly id: string;
  readonly label: string;
  readonly count: number;
  readonly displayCount: string;
  readonly sourceUrl?: string;
  readonly localCount?: number;
  readonly coveragePercent?: number;
  readonly mirrorStatus?: "sampled" | "partial" | "complete";
};

export type OccupationCountsCatalog = {
  readonly generatedAt: string;
  readonly source: string;
  readonly sourceUrl: string;
  readonly totalMajorGroups: number;
  readonly totalOccupations: number;
  readonly classifiedPercent?: number;
  readonly occupations: readonly OccupationCount[];
};

const SKILLSMP_OCCUPATIONS_URL = "https://skillsmp.com/occupations";

const MAJOR_GROUP_URLS: Record<string, string> = {
  "01": "https://skillsmp.com/occupations/15-0000",
  "02": "https://skillsmp.com/occupations/13-0000",
  "03": "https://skillsmp.com/occupations/27-0000",
  "04": "https://skillsmp.com/occupations/43-0000",
  "05": "https://skillsmp.com/occupations/23-0000",
  "06": "https://skillsmp.com/occupations/25-0000",
  "07": "https://skillsmp.com/occupations/19-0000",
  "08": "https://skillsmp.com/occupations/11-0000",
  "09": "https://skillsmp.com/occupations/41-0000",
  "10": "https://skillsmp.com/occupations/17-0000",
  "11": "https://skillsmp.com/occupations/29-0000",
  "12": "https://skillsmp.com/occupations/39-0000",
  "13": "https://skillsmp.com/occupations/21-0000",
  "14": "https://skillsmp.com/occupations/55-0000",
  "15": "https://skillsmp.com/occupations/35-0000",
  "16": "https://skillsmp.com/occupations/53-0000",
  "17": "https://skillsmp.com/occupations/31-0000",
  "18": "https://skillsmp.com/occupations/33-0000",
  "19": "https://skillsmp.com/occupations/47-0000",
  "20": "https://skillsmp.com/occupations/45-0000",
  "21": "https://skillsmp.com/occupations/51-0000",
  "22": "https://skillsmp.com/occupations/49-0000",
  "23": "https://skillsmp.com/occupations/37-0000",
};

export const DEFAULT_OCCUPATION_COUNTS: readonly OccupationCount[] = withSourceUrls([
  { id: "01", label: "Computer and Mathematical", count: 1_199_690, displayCount: "1.2M" },
  { id: "02", label: "Business and Financial Operations", count: 180_711, displayCount: "181k" },
  { id: "03", label: "Arts, Design, Entertainment, Sports, and Media", count: 79_595, displayCount: "79.6k" },
  { id: "04", label: "Office and Administrative Support", count: 41_915, displayCount: "41.9k" },
  { id: "05", label: "Legal", count: 23_361, displayCount: "23.4k" },
  { id: "06", label: "Educational Instruction and Library", count: 19_305, displayCount: "19.3k" },
  { id: "07", label: "Life, Physical, and Social Science", count: 18_983, displayCount: "19.0k" },
  { id: "08", label: "Management", count: 12_044, displayCount: "12.0k" },
  { id: "09", label: "Sales and Related", count: 6_801, displayCount: "6.8k" },
  { id: "10", label: "Architecture and Engineering", count: 5_584, displayCount: "5.6k" },
  { id: "11", label: "Healthcare Practitioners and Technical", count: 4_507, displayCount: "4.5k" },
  { id: "12", label: "Personal Care and Service", count: 3_819, displayCount: "3.8k" },
  { id: "13", label: "Community and Social Service", count: 2_650, displayCount: "2.7k" },
  { id: "14", label: "Military Specific", count: 2_148, displayCount: "2.1k" },
  { id: "15", label: "Food Preparation and Serving Related", count: 1_228, displayCount: "1.2k" },
  { id: "16", label: "Transportation and Material Moving", count: 925, displayCount: "925" },
  { id: "17", label: "Healthcare Support", count: 610, displayCount: "610" },
  { id: "18", label: "Protective Service", count: 579, displayCount: "579" },
  { id: "19", label: "Construction and Extraction", count: 389, displayCount: "389" },
  { id: "20", label: "Farming, Fishing, and Forestry", count: 387, displayCount: "387" },
  { id: "21", label: "Production", count: 253, displayCount: "253" },
  { id: "22", label: "Installation, Maintenance, and Repair", count: 229, displayCount: "229" },
  { id: "23", label: "Building and Grounds Cleaning and Maintenance", count: 120, displayCount: "120" },
]);

export async function buildOccupationCountsCatalog(options: {
  readonly allowExternalFetch?: boolean;
  readonly generatedAt?: string;
  readonly fallbackPath?: string;
} = {}): Promise<OccupationCountsCatalog> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  if (options.allowExternalFetch) {
    try {
      const response = await fetch(SKILLSMP_OCCUPATIONS_URL, {
        headers: { "User-Agent": "SkillscaleBot/0.1 (+https://skillscale.local)" },
      });
      if (!response.ok) throw new Error(`SkillsMP occupations HTTP ${response.status}`);
      return parseSkillsmpOccupationCounts(await response.text(), generatedAt);
    } catch {
      const fallback = options.fallbackPath ? await readExistingOccupationCounts(options.fallbackPath) : null;
      if (fallback) return { ...fallback, generatedAt };
    }
  }

  return {
    generatedAt,
    source: "SkillsMP",
    sourceUrl: SKILLSMP_OCCUPATIONS_URL,
    totalMajorGroups: 23,
    totalOccupations: 867,
    classifiedPercent: 93,
    occupations: DEFAULT_OCCUPATION_COUNTS,
  };
}

export function parseSkillsmpOccupationCounts(html: string, generatedAt = new Date().toISOString()): OccupationCountsCatalog {
  const text = stripTags(html);
  const classifiedPercent = numberFromMatch(text.match(/(\d+)%\s+classified/i)?.[1]);
  const totals = text.match(/(\d+)\s+major groups\s+·\s+([\d,]+)\s+SOC occupations/i);
  const occupations: OccupationCount[] = [];
  const groupPattern = /#\s+(\d{2})\s+(.+?)\s+([\d,]+)\s+skills/g;
  for (const match of text.matchAll(groupPattern)) {
    occupations.push({
      id: match[1],
      label: normalizeLabel(match[2]),
      count: Number(match[3].replace(/,/g, "")),
      displayCount: formatSkillCount(Number(match[3].replace(/,/g, ""))),
    });
  }

  return {
    generatedAt,
    source: "SkillsMP",
    sourceUrl: SKILLSMP_OCCUPATIONS_URL,
    totalMajorGroups: numberFromMatch(totals?.[1]) ?? occupations.length,
    totalOccupations: numberFromMatch(totals?.[2]) ?? 867,
    classifiedPercent,
    occupations: occupations.length ? withSourceUrls(occupations.slice(0, 23)) : DEFAULT_OCCUPATION_COUNTS,
  };
}

export function addLocalCoverage(
  catalog: OccupationCountsCatalog,
  skills: readonly { readonly occupationId: string }[]
): OccupationCountsCatalog {
  const localCounts = skills.reduce<Record<string, number>>((acc, skill) => {
    acc[skill.occupationId] = (acc[skill.occupationId] ?? 0) + 1;
    return acc;
  }, {});

  return {
    ...catalog,
    occupations: catalog.occupations.map((occupation) => {
      const localCount = localCounts[occupation.id] ?? 0;
      const coveragePercent = occupation.count > 0 ? Number(((localCount / occupation.count) * 100).toFixed(4)) : 0;
      return {
        ...occupation,
        sourceUrl: occupation.sourceUrl ?? MAJOR_GROUP_URLS[occupation.id],
        localCount,
        coveragePercent,
        mirrorStatus: localCount >= occupation.count ? "complete" : coveragePercent >= 1 ? "partial" : "sampled",
      };
    }),
  };
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeLabel(value: string): string {
  return value.replace(/\s+Occupations$/i, "").trim();
}

function numberFromMatch(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const number = Number(value.replace(/,/g, ""));
  return Number.isFinite(number) ? number : undefined;
}

function formatSkillCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1)}M`;
  if (count >= 10_000) return `${Math.round(count / 1_000)}k`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return count.toLocaleString();
}

function withSourceUrls(occupations: readonly OccupationCount[]): OccupationCount[] {
  return occupations.map((occupation) => ({
    ...occupation,
    sourceUrl: occupation.sourceUrl ?? MAJOR_GROUP_URLS[occupation.id],
  }));
}

async function readExistingOccupationCounts(filePath: string): Promise<OccupationCountsCatalog | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as OccupationCountsCatalog;
  } catch {
    return null;
  }
}
