import { GenericSourceAdapter } from "./base";

export const claudeOfficialPluginsAdapter = () =>
  new GenericSourceAdapter("claude-official-plugins", "https://claude.com/plugins", "website", ["https://claude.com/plugins"], { requestsPerMinute: 10 }, true, "Claude");
