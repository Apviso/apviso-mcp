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

interface Finding {
  description?: string;
  [key: string]: unknown;
}

function truncateFindings(data: unknown): unknown {
  if (typeof data !== "object" || data === null) return data;
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.findings)) {
    obj.findings = (obj.findings as Finding[]).map((f) => {
      if (f.description && f.description.length > 500) {
        return { ...f, description: f.description.slice(0, 500) + "... [use get_report for full details]" };
      }
      return f;
    });
  }
  return obj;
}

export function registerFindingTools(server: McpServer, client: ApvisoClient) {
  server.tool(
    "list_findings",
    "List findings (vulnerabilities) for a specific scan. Results are paginated and descriptions are truncated — use get_report for full finding details. Filter by severity (critical/high/medium/low/info) or status (open/in_progress/fixed/accepted_risk/false_positive).",
    {
      scanId: z.string().describe("The scan ID to list findings for"),
      page: z.number().int().min(1).optional().describe("Page number (default: 1)"),
      limit: z.number().int().min(1).max(100).optional().describe("Items per page (default: 20)"),
      severity: z
        .enum(["critical", "high", "medium", "low", "info"])
        .optional()
        .describe("Filter by severity level"),
      userStatus: z
        .enum(["open", "in_progress", "fixed", "accepted_risk", "false_positive"])
        .optional()
        .describe("Filter by finding status"),
    },
    async ({ scanId, page, limit, severity, userStatus }) => {
      try {
        const params: Record<string, string> = {};
        if (page) params.page = String(page);
        if (limit) params.limit = String(limit);
        if (severity) params.severity = severity;
        if (userStatus) params.userStatus = userStatus;
        const data = await client.get(`/v1/scans/${scanId}/findings`, params);
        return ok(truncateFindings(data));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "update_finding_status",
    "Update the status of a finding. Use this to track remediation progress: open → in_progress → fixed, or mark as accepted_risk or false_positive.",
    {
      findingId: z.string().describe("The finding ID to update"),
      userStatus: z
        .enum(["open", "in_progress", "fixed", "accepted_risk", "false_positive"])
        .describe("The new status for the finding"),
    },
    async ({ findingId, userStatus }) => {
      try {
        return ok(await client.patch(`/v1/findings/${findingId}/status`, { userStatus }));
      } catch (e) {
        return err(e);
      }
    },
  );
}
