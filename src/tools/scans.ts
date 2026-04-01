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

export function registerScanTools(server: McpServer, client: ApvisoClient) {
  server.tool(
    "list_scans",
    "List your scans with optional filtering by status. Returns paginated results including scan status, target info, and timestamps.",
    {
      page: z.number().int().min(1).optional().describe("Page number (default: 1)"),
      limit: z.number().int().min(1).max(100).optional().describe("Items per page (default: 20)"),
      status: z
        .enum(["queued", "provisioning", "running", "completed", "failed", "cancelled"])
        .optional()
        .describe("Filter by scan status"),
    },
    async ({ page, limit, status }) => {
      try {
        const params: Record<string, string> = {};
        if (page) params.page = String(page);
        if (limit) params.limit = String(limit);
        if (status) params.status = status;
        return ok(await client.get("/v1/scans", params));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "get_scan",
    "Get details for a specific scan including status, target, model preset, timestamps, and whether it's a retest. Use this to check scan progress.",
    { scanId: z.string().describe("The scan ID") },
    async ({ scanId }) => {
      try {
        return ok(await client.get(`/v1/scans/${scanId}`));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "create_scan",
    "Start a new penetration test scan. IMPORTANT: This creates a billable scan that costs credits. The target must be verified first. Check quota with get_quota before starting. modelPreset controls depth: 'free' uses free credits, 'low' is fastest, 'ultra' is most thorough and expensive.",
    {
      targetId: z.string().describe("The verified target ID to scan"),
      isRetest: z.boolean().optional().describe("Whether this is a retest of previous findings"),
      parentScanId: z.string().optional().describe("Parent scan ID (required for retests)"),
      findingIds: z
        .array(z.string())
        .optional()
        .describe("Specific finding IDs to retest (for retests only)"),
      modelPreset: z
        .enum(["free", "low", "medium", "high", "ultra"])
        .optional()
        .describe("AI model quality preset — higher means more thorough but costs more credits"),
      promoCode: z.string().optional().describe("Promotional code for discounted scan"),
    },
    async ({ targetId, isRetest, parentScanId, findingIds, modelPreset, promoCode }) => {
      try {
        const body: Record<string, unknown> = { targetId };
        if (isRetest !== undefined) body.isRetest = isRetest;
        if (parentScanId) body.parentScanId = parentScanId;
        if (findingIds) body.findingIds = findingIds;
        if (modelPreset) body.modelPreset = modelPreset;
        if (promoCode) body.promoCode = promoCode;
        return ok(await client.post("/v1/scans", body));
      } catch (e) {
        return err(e);
      }
    },
  );
}
