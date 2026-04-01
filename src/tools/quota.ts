import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApvisoClient, ApiError } from "../client.js";

export function registerQuotaTools(server: McpServer, client: ApvisoClient) {
  server.tool(
    "get_quota",
    "Get your current quota usage including subscription tier, credits remaining, and billing period dates. Use this to check available scan credits before starting a new scan.",
    {},
    async () => {
      try {
        const data = await client.get("/v1/quota");
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : String(e);
        return { content: [{ type: "text" as const, text: msg }], isError: true };
      }
    },
  );
}
