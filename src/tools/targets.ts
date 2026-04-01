import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApvisoClient, ApiError } from "../client.js";

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function err(e: unknown) {
  const msg = e instanceof ApiError ? e.message : String(e);
  return { content: [{ type: "text" as const, text: msg }], isError: true };
}

export function registerTargetTools(server: McpServer, client: ApvisoClient) {
  server.tool(
    "list_targets",
    "List all your registered targets (domains). Returns paginated results with verification status.",
    {
      page: z.number().int().min(1).optional().describe("Page number (default: 1)"),
      limit: z.number().int().min(1).max(100).optional().describe("Items per page (default: 20)"),
    },
    async ({ page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (page) params.page = String(page);
        if (limit) params.limit = String(limit);
        return ok(await client.get("/v1/targets", params));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "get_target",
    "Get details for a specific target including domain, verification status, and whether authentication is configured.",
    { targetId: z.string().describe("The target ID") },
    async ({ targetId }) => {
      try {
        return ok(await client.get(`/v1/targets/${targetId}`));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "create_target",
    "Register a new target domain for scanning. The target must be verified before it can be scanned. After creating, use get_verification_instructions to see how to verify ownership.",
    { domain: z.string().describe("The domain to register (e.g. example.com)") },
    async ({ domain }) => {
      try {
        return ok(await client.post("/v1/targets", { domain }));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "verify_target",
    "Verify ownership of a target using one of three methods: dns_txt (add a DNS TXT record), file (upload a verification file to /.well-known/penterep-verify.txt), or meta_tag (add a meta tag to your homepage). Use get_verification_instructions first to see the required values.",
    {
      targetId: z.string().describe("The target ID to verify"),
      method: z.enum(["dns_txt", "file", "meta_tag"]).describe("Verification method"),
    },
    async ({ targetId, method }) => {
      try {
        return ok(await client.post(`/v1/targets/${targetId}/verify`, { method }));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "get_verification_instructions",
    "Get the verification token and step-by-step instructions for all three verification methods (DNS TXT, file upload, meta tag) for a target.",
    { targetId: z.string().describe("The target ID") },
    async ({ targetId }) => {
      try {
        return ok(await client.get(`/v1/targets/${targetId}/verify/instructions`));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "delete_target",
    "Delete a target. This will fail if the target has any associated scans.",
    { targetId: z.string().describe("The target ID to delete") },
    async ({ targetId }) => {
      try {
        return ok(await client.delete(`/v1/targets/${targetId}`));
      } catch (e) {
        return err(e);
      }
    },
  );
}
