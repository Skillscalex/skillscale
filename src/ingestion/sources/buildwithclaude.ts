import { GenericSourceAdapter } from "./base";

export const buildWithClaudeAdapter = () =>
  new GenericSourceAdapter("buildwithclaude", "https://buildwithclaude.com", "website", ["https://buildwithclaude.com"], { requestsPerMinute: 12 });
