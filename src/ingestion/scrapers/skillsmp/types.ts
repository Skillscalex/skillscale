export interface SkillsmpSkill {
  id: string;
  name: string;
  skillsmpUrl: string;
  author: string;
  authorUrl: string;
  githubUrl: string;
  dateModified: string;
  description: string;
  categories: string[];
  tags: string[];
  readme: string;
  stars: number;
  installCommand: string;
  occupations: string[];
  similarSkills: string[];
  scrapedAt: string;
  phase: 1 | 2;
  parseError?: string;
}

export interface ScrapeProgress {
  phase: 1 | 2;
  discovered: number;
  completed: number;
  failed: number;
  retryQueue: number;
  startedAt: string;
  lastUpdate: string;
  ratePerMin: number;
  etaDays: number;
}

export interface SkillIndexEntry {
  id: string;
  name: string;
  author: string;
  description: string;
  stars: number;
  categories: string[];
  tags: string[];
  githubUrl: string;
  dateModified: string;
  scrapedAt: string;
  phase: 1 | 2;
}

export interface FailedEntry {
  url: string;
  id: string;
  error: string;
  attempts: number;
  lastAttempt: string;
}
