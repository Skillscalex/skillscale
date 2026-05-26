import { GenericSourceAdapter } from "./base";

export const awesomeClaudeCodeAdapter = () =>
  new GenericSourceAdapter(
    "awesome-claude-code",
    "https://github.com/hesreallyhim/awesome-claude-code",
    "github_repo",
    ["https://raw.githubusercontent.com/hesreallyhim/awesome-claude-code/main/README.md"],
    { requestsPerMinute: 30 },
    true,
    "GitHub Awesome"
  );

export const awesomeClaudeSkillsAdapter = () =>
  new GenericSourceAdapter(
    "awesome-claude-skills",
    "https://github.com/travisvn/awesome-claude-skills",
    "github_repo",
    ["https://raw.githubusercontent.com/travisvn/awesome-claude-skills/main/README.md"],
    { requestsPerMinute: 30 },
    true,
    "GitHub Awesome"
  );
