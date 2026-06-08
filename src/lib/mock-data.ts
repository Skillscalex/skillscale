import type { Skill, Review } from "@/types/skill";

export const MOCK_SKILLS: Skill[] = [
  {
    id: "skill-001",
    title: "CodeReview Pro",
    description: "Automated AI-powered code review with security scanning, style enforcement, and refactoring suggestions. Supports 20+ languages.",
    creator_id: "user-001",
    creator: { id: "user-001", email: "alice@dev.io", username: "alice_dev", avatar_url: null, platform_token_balance: 5000, wallet_address: null, created_at: "2024-01-01T00:00:00Z" },
    gem_tier: "diamond",
    price_usd: 49.99,
    crypto_price_eth: 0.015,
    is_free: false,
    is_minted: true,
    nft_token_id: "NFT-001",
    plugin_json: { name: "code-review-pro", version: "2.1.0", description: "Advanced code review", author: "alice_dev" },
    category: "Development",
    tags: ["code-review", "security", "refactoring", "typescript"],
    secure_score: 96,
    model_recommendation: "claude-opus-4-7",
    downloads: 12840,
    created_at: "2024-02-15T10:00:00Z",
    current_price: 49.99,
    price_change_24h: 3.2,
    volume_24h: 1240,
    rating: 4.8,
    review_count: 312,
    skills_readme: `# CodeReview Pro

## Overview
CodeReview Pro is an enterprise-grade AI code review skill that integrates directly into your Claude Code workflow. It analyzes pull requests, detects bugs, suggests refactors, and enforces your team's style guide — all in seconds.

## Features
- **Security Scanning** — Detects OWASP Top 10 vulnerabilities, SQL injection, XSS risks
- **Style Enforcement** — ESLint, Prettier, and custom ruleset support
- **Refactoring Suggestions** — Identifies dead code, performance bottlenecks, and anti-patterns
- **Multi-language** — TypeScript, Python, Go, Rust, Java, C++, and 15 more

## Usage
\`\`\`bash
/review --scope=pr --security --style
\`\`\`

## Requirements
- Claude Code CLI ≥ 1.5
- Supports repos up to 500k lines
- Works with GitHub, GitLab, Bitbucket

## Changelog
**v2.1.0** — Added Rust support, improved SQL injection detection
**v2.0.0** — Rewrote engine for 3× faster analysis`,
  },
  {
    id: "skill-002",
    title: "DataViz Wizard",
    description: "Transform raw data into beautiful interactive charts and dashboards. Supports CSV, JSON, SQL outputs.",
    creator_id: "user-002",
    creator: { id: "user-002", email: "bob@analytics.io", username: "data_bob", avatar_url: null, platform_token_balance: 3200, wallet_address: "0x742d35cc6634c0532925a3b8d4c9b5b2", created_at: "2024-01-05T00:00:00Z" },
    gem_tier: "emerald",
    price_usd: 29.99,
    crypto_price_eth: 0.009,
    is_free: false,
    is_minted: false,
    nft_token_id: null,
    plugin_json: { name: "dataviz-wizard", version: "1.3.0", description: "Data visualization", author: "data_bob" },
    category: "Data Science",
    tags: ["data", "visualization", "charts", "analytics"],
    secure_score: 88,
    model_recommendation: "claude-sonnet-4-6",
    downloads: 7320,
    created_at: "2024-03-01T10:00:00Z",
    current_price: 29.99,
    price_change_24h: -1.5,
    volume_24h: 860,
    rating: 4.5,
    review_count: 178,
    skills_readme: `# DataViz Wizard

## Overview
Transform raw data into stunning interactive visualizations. Supports CSV, JSON, Parquet, and live SQL queries.

## Supported Chart Types
- Line, Bar, Area, Scatter, Bubble
- Heatmaps, Treemaps, Sankey diagrams
- Geo maps with choropleth support

## Usage
\`\`\`bash
/viz --input data.csv --type dashboard --theme dark
\`\`\`

## Output Formats
Exports to HTML (interactive), PNG, SVG, or embeddable React components.`,
  },
  {
    id: "skill-003",
    title: "DocWriter AI",
    description: "Generates comprehensive documentation from code comments, function signatures, and README files.",
    creator_id: "user-003",
    creator: { id: "user-003", email: "carol@write.io", username: "carol_writes", avatar_url: null, platform_token_balance: 1800, wallet_address: null, created_at: "2024-01-10T00:00:00Z" },
    gem_tier: "pearl",
    price_usd: 14.99,
    crypto_price_eth: 0.004,
    is_free: false,
    is_minted: false,
    nft_token_id: null,
    plugin_json: { name: "doc-writer-ai", version: "1.0.2", description: "Documentation generator", author: "carol_writes" },
    category: "Writing",
    tags: ["documentation", "writing", "markdown", "readme"],
    secure_score: 74,
    model_recommendation: "claude-sonnet-4-6",
    downloads: 3100,
    created_at: "2024-03-20T10:00:00Z",
    current_price: 14.99,
    price_change_24h: 0.8,
    volume_24h: 320,
  },
  {
    id: "skill-004",
    title: "TestGen Ultra",
    description: "Automatically generates unit tests, integration tests, and E2E test scenarios from your codebase.",
    creator_id: "user-001",
    creator: { id: "user-001", email: "alice@dev.io", username: "alice_dev", avatar_url: null, platform_token_balance: 5000, wallet_address: null, created_at: "2024-01-01T00:00:00Z" },
    gem_tier: "diamond",
    price_usd: 39.99,
    crypto_price_eth: 0.012,
    is_free: false,
    is_minted: true,
    nft_token_id: "NFT-002",
    plugin_json: { name: "testgen-ultra", version: "3.0.0", description: "Test generation", author: "alice_dev" },
    category: "Development",
    tags: ["testing", "unit-tests", "jest", "pytest"],
    secure_score: 94,
    model_recommendation: "claude-opus-4-7",
    downloads: 9450,
    created_at: "2024-04-01T10:00:00Z",
    current_price: 39.99,
    price_change_24h: 5.1,
    volume_24h: 2100,
  },
  {
    id: "skill-005",
    title: "SEO Booster",
    description: "Analyzes content and generates SEO-optimized meta tags, structured data, and keyword strategies.",
    creator_id: "user-004",
    creator: { id: "user-004", email: "diana@seo.io", username: "seo_diana", avatar_url: null, platform_token_balance: 900, wallet_address: null, created_at: "2024-02-01T00:00:00Z" },
    gem_tier: "quartz",
    price_usd: 9.99,
    crypto_price_eth: 0.003,
    is_free: false,
    is_minted: false,
    nft_token_id: null,
    plugin_json: { name: "seo-booster", version: "1.1.0", description: "SEO optimization", author: "seo_diana" },
    category: "Marketing",
    tags: ["seo", "marketing", "content", "keywords"],
    secure_score: 58,
    model_recommendation: "claude-haiku-4-5",
    downloads: 1200,
    created_at: "2024-04-15T10:00:00Z",
    current_price: 9.99,
    price_change_24h: -2.3,
    volume_24h: 180,
  },
  {
    id: "skill-006",
    title: "GitCommit Master",
    description: "Generates perfect git commit messages, PR descriptions, and changelogs following conventional commits.",
    creator_id: "user-005",
    creator: { id: "user-005", email: "eve@git.io", username: "git_eve", avatar_url: null, platform_token_balance: 2100, wallet_address: "0x9ab3e21fa7c8d4b561e8c2f3a9d0e4f1", created_at: "2024-02-15T00:00:00Z" },
    gem_tier: "emerald",
    price_usd: 0,
    crypto_price_eth: null,
    is_free: true,
    is_minted: false,
    nft_token_id: null,
    plugin_json: { name: "gitcommit-master", version: "2.0.0", description: "Git commit generator", author: "git_eve" },
    category: "Development",
    tags: ["git", "commits", "changelog", "conventional-commits"],
    secure_score: 85,
    model_recommendation: "claude-haiku-4-5",
    downloads: 21000,
    created_at: "2024-01-20T10:00:00Z",
    current_price: 0,
    price_change_24h: 0,
    volume_24h: 0,
  },
  {
    id: "skill-007",
    title: "APIDesigner Pro",
    description: "Designs and generates OpenAPI specs, REST endpoints, GraphQL schemas, and SDK clients from natural language.",
    creator_id: "user-002",
    creator: { id: "user-002", email: "bob@analytics.io", username: "data_bob", avatar_url: null, platform_token_balance: 3200, wallet_address: "0x742d35cc6634c0532925a3b8d4c9b5b2", created_at: "2024-01-05T00:00:00Z" },
    gem_tier: "diamond",
    price_usd: 59.99,
    crypto_price_eth: 0.018,
    is_free: false,
    is_minted: true,
    nft_token_id: "NFT-003",
    plugin_json: { name: "api-designer-pro", version: "4.0.0", description: "API design assistant", author: "data_bob" },
    category: "Development",
    tags: ["api", "openapi", "graphql", "sdk", "rest"],
    secure_score: 92,
    model_recommendation: "claude-opus-4-7",
    downloads: 6700,
    created_at: "2024-05-01T10:00:00Z",
    current_price: 59.99,
    price_change_24h: 8.4,
    volume_24h: 3200,
  },
  {
    id: "skill-008",
    title: "TranslateStack",
    description: "Translates technical documentation, code comments, and UI strings across 50+ languages with developer terminology awareness.",
    creator_id: "user-006",
    creator: { id: "user-006", email: "frank@i18n.io", username: "i18n_frank", avatar_url: null, platform_token_balance: 700, wallet_address: null, created_at: "2024-03-01T00:00:00Z" },
    gem_tier: "pearl",
    price_usd: 19.99,
    crypto_price_eth: 0.006,
    is_free: false,
    is_minted: false,
    nft_token_id: null,
    plugin_json: { name: "translate-stack", version: "1.5.0", description: "Technical translation", author: "i18n_frank" },
    category: "Productivity",
    tags: ["translation", "i18n", "localization", "multilingual"],
    secure_score: 71,
    model_recommendation: "claude-sonnet-4-6",
    downloads: 2800,
    created_at: "2024-05-10T10:00:00Z",
    current_price: 19.99,
    price_change_24h: 1.2,
    volume_24h: 440,
  },
  {
    id: "skill-009",
    title: "SecurityScanner",
    description: "Deep security analysis of codebases: OWASP vulnerability detection, dependency audits, secrets scanning.",
    creator_id: "user-007",
    creator: { id: "user-007", email: "grace@security.io", username: "sec_grace", avatar_url: null, platform_token_balance: 8900, wallet_address: "0x1b4d0e3f2a7c8b9e5d6a1f4e3c2b1a0d", created_at: "2024-01-01T00:00:00Z" },
    gem_tier: "diamond",
    price_usd: 79.99,
    crypto_price_eth: 0.024,
    is_free: false,
    is_minted: true,
    nft_token_id: "NFT-004",
    plugin_json: { name: "security-scanner", version: "5.0.0", description: "Security vulnerability scanner", author: "sec_grace" },
    category: "Security",
    tags: ["security", "owasp", "vulnerabilities", "scanning", "compliance"],
    secure_score: 99,
    model_recommendation: "claude-opus-4-7",
    downloads: 15600,
    created_at: "2024-02-01T10:00:00Z",
    current_price: 79.99,
    price_change_24h: 2.7,
    volume_24h: 4800,
    rating: 4.9,
    review_count: 521,
    skills_readme: `# SecurityScanner

## Overview
The most comprehensive security analysis skill on Skillscale. Used by 500+ engineering teams to catch vulnerabilities before production.

## What It Scans
- **OWASP Top 10** — Injection, XSS, CSRF, misconfigurations, and more
- **Secrets Detection** — API keys, tokens, passwords in code and git history
- **Dependency Audit** — CVE database lookup for all npm, pip, cargo, and gem packages
- **SAST** — Static analysis across the entire codebase

## Usage
\`\`\`bash
/scan --deep --secrets --deps --output report.json
\`\`\`

## Compliance Reports
Generates GDPR, SOC2, and ISO 27001 ready reports.`,
  },
  {
    id: "skill-010",
    title: "QuickSummarize",
    description: "Instantly summarizes long documents, articles, meeting notes, and codebases into structured bullet points.",
    creator_id: "user-008",
    creator: { id: "user-008", email: "henry@sum.io", username: "henry_sum", avatar_url: null, platform_token_balance: 400, wallet_address: null, created_at: "2024-04-01T00:00:00Z" },
    gem_tier: "quartz",
    price_usd: 0,
    crypto_price_eth: null,
    is_free: true,
    is_minted: false,
    nft_token_id: null,
    plugin_json: { name: "quick-summarize", version: "1.0.0", description: "Document summarizer", author: "henry_sum" },
    category: "Productivity",
    tags: ["summarization", "productivity", "reading", "notes"],
    secure_score: 55,
    model_recommendation: "claude-haiku-4-5",
    downloads: 8900,
    created_at: "2024-06-01T10:00:00Z",
    current_price: 0,
    price_change_24h: 0,
    volume_24h: 0,
    rating: 3.9,
    review_count: 94,
    skills_readme: `# QuickSummarize

## Overview
Free skill that condenses any text into structured bullets in seconds. Great for meeting notes, long docs, and code overviews.

## Usage
\`\`\`bash
/summarize --input meeting-notes.txt --depth 3
\`\`\`

## Output Modes
- **Bullets** (default) — nested bullet points
- **TLDR** — single paragraph executive summary
- **Structured** — sections with headers`,
  },
  {
    id: "skill-011",
    title: "Autonomous Skill Harvester",
    description: "Governed continuous discovery, normalization, SkillSpector-compatible scanning, and simulated publication for AI agent skills.",
    creator_id: "user-007",
    creator: { id: "user-007", email: "grace@security.io", username: "sec_grace", avatar_url: null, platform_token_balance: 8900, wallet_address: "0x1b4d0e3f2a7c8b9e5d6a1f4e3c2b1a0d", created_at: "2024-01-01T00:00:00Z" },
    gem_tier: "diamond",
    price_usd: 0,
    crypto_price_eth: null,
    is_free: true,
    is_minted: false,
    nft_token_id: null,
    plugin_json: { name: "autonomous-skill-harvester", version: "0.1.0", description: "Governed skill ingestion loop", author: "skillscale" },
    category: "Security",
    tags: ["agentic", "ingestion", "skillspector", "security", "governance"],
    secure_score: 97,
    model_recommendation: "claude-sonnet-4-6",
    downloads: 4200,
    created_at: "2026-06-08T00:00:00Z",
    current_price: 0,
    price_change_24h: 0,
    volume_24h: 0,
    rating: 4.8,
    review_count: 41,
    skills_readme: `# Autonomous Skill Harvester

## Overview
Continuously discovers public AI agent skills, normalizes metadata, applies a local SkillSpector-compatible scanner, and routes results through Agentic Civilization governance.

## Safety Defaults
- Dry-run and simulated by default
- No scraped install commands are executed
- Critical scanner findings are blocked before publication
- Dynamic rendering is a fallback after registry, sitemap, and static HTML extraction

## Usage
\`\`\`bash
npm run autonomous:skills
\`\`\`

The live fetch path requires explicit runtime flags and still preserves scanner and governance constraints.`,
  },
];

export const MOCK_STATS = {
  total_skills: 1847,
  total_volume_24h: 284920,
  active_traders: 3241,
  new_skills_today: 23,
};

export const CATEGORIES = [
  "All",
  "Development",
  "Data Science",
  "Security",
  "Writing",
  "Marketing",
  "Productivity",
  "Design",
  "Finance",
  "Research",
];

export const MOCK_REVIEWS: Record<string, import("@/types/skill").Review[]> = {
  "skill-001": [
    { id: "r1", skill_id: "skill-001", user_id: "u1", username: "devsam", avatar_url: null, rating: 5, comment: "This is the best code review tool I've used. Caught a SQL injection bug our team missed for weeks. Worth every penny.", created_at: "2024-11-10T09:00:00Z", helpful_count: 47 },
    { id: "r2", skill_id: "skill-001", user_id: "u2", username: "mia_codes", avatar_url: null, rating: 5, comment: "Incredible. Integrated into our CI in 10 minutes. The security scanning alone justifies the cost for any team.", created_at: "2024-11-05T14:30:00Z", helpful_count: 31 },
    { id: "r3", skill_id: "skill-001", user_id: "u3", username: "rustfan99", avatar_url: null, rating: 4, comment: "Really solid. The Rust support in v2.1 is good, though it occasionally over-flags safe unsafe blocks. Minor nitpick.", created_at: "2024-10-28T11:00:00Z", helpful_count: 18 },
    { id: "r4", skill_id: "skill-001", user_id: "u4", username: "backend_leo", avatar_url: null, rating: 5, comment: "Replaced our entire manual review checklist. The refactoring suggestions are genuinely smart, not just pattern matches.", created_at: "2024-10-15T16:00:00Z", helpful_count: 24 },
  ],
  "skill-002": [
    { id: "r5", skill_id: "skill-002", user_id: "u5", username: "data_nina", avatar_url: null, rating: 5, comment: "The Sankey diagrams alone are worth it. Beautiful output, exports perfectly to our React dashboards.", created_at: "2024-11-08T10:00:00Z", helpful_count: 22 },
    { id: "r6", skill_id: "skill-002", user_id: "u6", username: "analyst_tom", avatar_url: null, rating: 4, comment: "Great tool. Handles large CSVs fast. Would love native Parquet support in the next version.", created_at: "2024-10-20T13:00:00Z", helpful_count: 15 },
    { id: "r7", skill_id: "skill-002", user_id: "u7", username: "viz_queen", avatar_url: null, rating: 4, comment: "Dark theme outputs look stunning. The geo map choropleth is still a bit rough around the edges.", created_at: "2024-10-01T08:30:00Z", helpful_count: 9 },
  ],
  "skill-009": [
    { id: "r8", skill_id: "skill-009", user_id: "u8", username: "sec_ops_kai", avatar_url: null, rating: 5, comment: "Found 3 critical CVEs in our dependency tree that Snyk missed. Mandatory for any serious engineering team.", created_at: "2024-11-12T07:00:00Z", helpful_count: 89 },
    { id: "r9", skill_id: "skill-009", user_id: "u9", username: "cto_ana", avatar_url: null, rating: 5, comment: "The SOC2 report generation saved us 2 weeks of manual work. The secrets scanner is incredibly accurate.", created_at: "2024-11-01T15:30:00Z", helpful_count: 61 },
    { id: "r10", skill_id: "skill-009", user_id: "u10", username: "pen_tester_x", avatar_url: null, rating: 5, comment: "As a pentester I'm skeptical of automated tools, but this one is different. The SAST engine actually understands context.", created_at: "2024-10-22T12:00:00Z", helpful_count: 44 },
  ],
};
