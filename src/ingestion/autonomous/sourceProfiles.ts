import type { AutonomousSourceProfile } from "./types";

export function getAutonomousSourceProfiles(): AutonomousSourceProfile[] {
  return [
    {
      id: "public-skill-registry",
      publicLabel: "Public skill registry",
      baseUrl: "https://skillsmp.com",
      discoveryUrls: [
        "https://skillsmp.com/index.md",
        "https://skillsmp.com/llms.txt",
        "https://skillsmp.com/categories/development",
      ],
      preferredMethods: ["registry", "sitemap", "static_html", "embedded_json"],
      enabled: true,
      maxRequestsPerMinute: 20,
      requiresDynamicRendering: false,
    },
    {
      id: "open-agent-skill-index",
      publicLabel: "Open agent skill index",
      baseUrl: "https://skills.sh",
      discoveryUrls: [
        "https://skills.sh",
        "https://skills.sh/sitemap.xml",
      ],
      preferredMethods: ["sitemap", "static_html", "embedded_json", "playwright"],
      enabled: true,
      maxRequestsPerMinute: 12,
      requiresDynamicRendering: true,
    },
    {
      id: "community-skill-market",
      publicLabel: "Community skill market",
      baseUrl: "https://skillsboss.com",
      discoveryUrls: [
        "https://skillsboss.com",
        "https://skillsboss.com/sitemap.xml",
      ],
      preferredMethods: ["sitemap", "static_html", "embedded_json", "playwright"],
      enabled: true,
      maxRequestsPerMinute: 12,
      requiresDynamicRendering: true,
    },
    {
      id: "vendor-verified-skill-catalog",
      publicLabel: "Verified vendor skill catalog",
      baseUrl: "https://github.com/NVIDIA/skills",
      discoveryUrls: [
        "https://github.com/NVIDIA/skills",
        "https://raw.githubusercontent.com/NVIDIA/skills/main/README.md",
      ],
      preferredMethods: ["github", "registry", "static_html"],
      enabled: true,
      maxRequestsPerMinute: 30,
      requiresDynamicRendering: false,
    },
  ];
}
