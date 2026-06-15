import { GenericSourceAdapter } from "./base";

export const skillsmpAdapter = () =>
  new GenericSourceAdapter(
    "skillsmp",
    "https://skillsmp.com",
    "website",
    [
      "https://skillsmp.com",
      "https://skillsmp.com/occupations",
      "https://skillsmp.com/index.md",
      "https://skillsmp.com/llms.txt",
      "https://skillsmp.com/categories/backend",
      "https://skillsmp.com/categories/frontend",
      "https://skillsmp.com/categories/development",
      "https://skillsmp.com/categories/testing-security",
      "https://skillsmp.com/categories/data-ai",
      "https://skillsmp.com/categories/devops",
      "https://skillsmp.com/categories/documentation",
      "https://skillsmp.com/categories/business",
      "https://skillsmp.com/categories/tools",
    ],
    { requestsPerMinute: 20 },
    true,
    "SkillsMP"
  );
