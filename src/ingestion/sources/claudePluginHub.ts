import { GenericSourceAdapter } from "./base";

export const claudePluginHubAdapter = () =>
  new GenericSourceAdapter("claude-plugin-hub", "https://www.claudepluginhub.com", "website", ["https://www.claudepluginhub.com"], { requestsPerMinute: 12 });
