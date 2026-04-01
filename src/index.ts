#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ApvisoClient } from "./client.js";
import { registerTargetTools } from "./tools/targets.js";
import { registerScanTools } from "./tools/scans.js";
import { registerFindingTools } from "./tools/findings.js";
import { registerReportTools } from "./tools/reports.js";
import { registerScheduleTools } from "./tools/schedules.js";
import { registerQuotaTools } from "./tools/quota.js";

const apiKey = process.env.APVISO_API_KEY;
if (!apiKey?.startsWith("apvk_")) {
  process.stderr.write(
    "Error: APVISO_API_KEY environment variable is required and must start with 'apvk_'\n" +
      "Get your API key from APVISO dashboard → Settings → API Keys\n",
  );
  process.exit(1);
}

const baseUrl = process.env.APVISO_API_URL || "https://app.apviso.com/api";
const client = new ApvisoClient(apiKey, baseUrl);

const server = new McpServer({
  name: "apviso",
  version: "0.1.0",
});

registerQuotaTools(server, client);
registerTargetTools(server, client);
registerScanTools(server, client);
registerFindingTools(server, client);
registerReportTools(server, client);
registerScheduleTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
