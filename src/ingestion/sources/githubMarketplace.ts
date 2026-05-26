import { GenericSourceAdapter } from "./base";

export const githubMarketplaceAdapter = () =>
  new GenericSourceAdapter(
    "claude-marketplace-github",
    "https://github.com/claude-market/marketplace",
    "github_repo",
    ["https://raw.githubusercontent.com/claude-market/marketplace/main/README.md"],
    { requestsPerMinute: 30 },
    true,
    "Claude Marketplace"
  );
