import { GenericSourceAdapter } from "./base";

export const aitmplAgentsAdapter = () =>
  new GenericSourceAdapter("aitmpl-agents", "https://www.aitmpl.com/agents/", "website", ["https://www.aitmpl.com/agents/"], { requestsPerMinute: 12 }, true, "AITmpl");

export const aitmplPluginsAdapter = () =>
  new GenericSourceAdapter("aitmpl-plugins", "https://www.aitmpl.com/plugins/", "website", ["https://www.aitmpl.com/plugins/"], { requestsPerMinute: 12 }, true, "AITmpl");
