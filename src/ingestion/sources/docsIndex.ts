import { GenericSourceAdapter } from "./base";

export const aitmplDocsIndexAdapter = () =>
  new GenericSourceAdapter("aitmpl-docs-index", "https://docs.aitmpl.com/llms.txt", "docs_index", ["https://docs.aitmpl.com/llms.txt"], { requestsPerMinute: 12 }, true, "AITmpl Docs");
