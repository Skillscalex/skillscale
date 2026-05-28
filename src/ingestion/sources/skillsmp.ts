import { GenericSourceAdapter } from "./base";

export const skillsmpAdapter = () =>
  new GenericSourceAdapter(
    "skillsmp",
    "https://skillsmp.com",
    "registry_json",
    [
      "https://skillsmp.com/api/v1/skills/search?q=software%20development&limit=50&page=1&sortBy=stars",
      "https://skillsmp.com/api/v1/skills/search?q=business%20finance&limit=50&page=1&sortBy=stars",
      "https://skillsmp.com/api/v1/skills/search?q=design%20media&limit=50&page=1&sortBy=stars",
      "https://skillsmp.com/api/v1/skills/search?q=education%20research&limit=50&page=1&sortBy=stars",
      "https://skillsmp.com/api/v1/skills/search?q=healthcare%20legal%20operations&limit=50&page=1&sortBy=stars",
    ],
    { requestsPerMinute: 20 },
    true,
    "SkillsMP"
  );
