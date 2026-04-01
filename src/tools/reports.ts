import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApvisoClient, ApiError } from "../client.js";

function err(e: unknown) {
  const msg = e instanceof ApiError ? e.message : String(e);
  return { content: [{ type: "text" as const, text: msg }], isError: true };
}

export function registerReportTools(server: McpServer, client: ApvisoClient) {
  server.tool(
    "get_report",
    "Get the full penetration test report for a completed scan. Returns the report as markdown content with complete finding details, evidence, and remediation guidance. Also includes a PDF download URL if available. This is the best tool for getting comprehensive scan results.",
    { scanId: z.string().describe("The scan ID to get the report for") },
    async ({ scanId }) => {
      try {
        const data = (await client.get(`/v1/scans/${scanId}/report`)) as Record<string, unknown>;
        const report = data.report as Record<string, unknown> | undefined;
        if (report?.markdownContent) {
          return {
            content: [
              { type: "text" as const, text: report.markdownContent as string },
              ...(report.pdfUrl
                ? [{ type: "text" as const, text: `\n\nPDF download: ${report.pdfUrl}` }]
                : []),
            ],
          };
        }
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (e) {
        if (e instanceof ApiError && e.status === 202) {
          return {
            content: [
              { type: "text" as const, text: "Report is still being generated. Try again in a moment." },
            ],
          };
        }
        return err(e);
      }
    },
  );
}
