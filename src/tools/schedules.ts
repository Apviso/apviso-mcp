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

export function registerScheduleTools(server: McpServer, client: ApvisoClient) {
  server.tool(
    "list_schedules",
    "List all your scan schedules. Schedules automatically run scans on a recurring basis (daily, weekly, biweekly, or monthly). Requires Business or Enterprise tier.",
    {},
    async () => {
      try {
        return ok(await client.get("/v1/schedules"));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "get_schedule",
    "Get details for a specific scan schedule including frequency, next run time, and configuration.",
    { scheduleId: z.string().describe("The schedule ID") },
    async ({ scheduleId }) => {
      try {
        return ok(await client.get(`/v1/schedules/${scheduleId}`));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "create_schedule",
    "Create a recurring scan schedule for a verified target. Requires Business or Enterprise tier. Scans will run automatically at the specified time and frequency.",
    {
      targetId: z.string().describe("The verified target ID to schedule scans for"),
      frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]).describe("How often to run the scan"),
      hour: z.number().int().min(0).max(23).describe("Hour of day to run (0-23, UTC)"),
      minute: z.number().int().min(0).max(59).optional().describe("Minute of hour (0-59, default: 0)"),
      dayOfWeek: z
        .number()
        .int()
        .min(0)
        .max(6)
        .optional()
        .describe("Day of week for weekly/biweekly (0=Sunday, 6=Saturday)"),
      dayOfMonth: z
        .number()
        .int()
        .min(1)
        .max(28)
        .optional()
        .describe("Day of month for monthly schedules (1-28)"),
      modelPreset: z
        .enum(["low", "medium", "high", "ultra"])
        .optional()
        .describe("AI model quality preset"),
      allowPayg: z
        .boolean()
        .optional()
        .describe("Allow pay-as-you-go billing if quota is exceeded"),
    },
    async ({ targetId, frequency, hour, minute, dayOfWeek, dayOfMonth, modelPreset, allowPayg }) => {
      try {
        const body: Record<string, unknown> = { targetId, frequency, hour };
        if (minute !== undefined) body.minute = minute;
        if (dayOfWeek !== undefined) body.dayOfWeek = dayOfWeek;
        if (dayOfMonth !== undefined) body.dayOfMonth = dayOfMonth;
        if (modelPreset) body.modelPreset = modelPreset;
        if (allowPayg !== undefined) body.allowPayg = allowPayg;
        return ok(await client.post("/v1/schedules", body));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "update_schedule",
    "Update an existing scan schedule. You can change the frequency, timing, model preset, or enable/disable it.",
    {
      scheduleId: z.string().describe("The schedule ID to update"),
      frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional().describe("New frequency"),
      hour: z.number().int().min(0).max(23).optional().describe("New hour (0-23, UTC)"),
      minute: z.number().int().min(0).max(59).optional().describe("New minute (0-59)"),
      dayOfWeek: z.number().int().min(0).max(6).optional().describe("New day of week (0=Sunday)"),
      dayOfMonth: z.number().int().min(1).max(28).optional().describe("New day of month (1-28)"),
      enabled: z.boolean().optional().describe("Enable or disable the schedule"),
      modelPreset: z.enum(["low", "medium", "high", "ultra"]).optional().describe("New model preset"),
      allowPayg: z.boolean().optional().describe("Allow pay-as-you-go billing"),
    },
    async ({
      scheduleId,
      frequency,
      hour,
      minute,
      dayOfWeek,
      dayOfMonth,
      enabled,
      modelPreset,
      allowPayg,
    }) => {
      try {
        const body: Record<string, unknown> = {};
        if (frequency !== undefined) body.frequency = frequency;
        if (hour !== undefined) body.hour = hour;
        if (minute !== undefined) body.minute = minute;
        if (dayOfWeek !== undefined) body.dayOfWeek = dayOfWeek;
        if (dayOfMonth !== undefined) body.dayOfMonth = dayOfMonth;
        if (enabled !== undefined) body.enabled = enabled;
        if (modelPreset !== undefined) body.modelPreset = modelPreset;
        if (allowPayg !== undefined) body.allowPayg = allowPayg;
        return ok(await client.patch(`/v1/schedules/${scheduleId}`, body));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "delete_schedule",
    "Delete a scan schedule. This stops all future scheduled scans for this target.",
    { scheduleId: z.string().describe("The schedule ID to delete") },
    async ({ scheduleId }) => {
      try {
        return ok(await client.delete(`/v1/schedules/${scheduleId}`));
      } catch (e) {
        return err(e);
      }
    },
  );
}
