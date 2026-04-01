# apviso-mcp

MCP server for interacting with the [APVISO](https://apviso.com) AI-powered penetration testing platform from Claude Code, Cursor, Windsurf, Codex, and other MCP-compatible tools.

## Setup

### 1. Get your API key

Go to your [APVISO dashboard](https://apviso.com) → Settings → API Keys and create a new key.

### 2. Add to Claude Code

```bash
claude mcp add --transport stdio apviso \
  --env APVISO_API_KEY=apvk_your_key_here \
  -- npx -y apviso-mcp
```

On Windows (not WSL):

```bash
claude mcp add --transport stdio apviso ^
  --env APVISO_API_KEY=apvk_your_key_here ^
  -- cmd /c npx -y apviso-mcp
```

### Alternative: manual config

Add to your `.mcp.json` (project-scoped) or `~/.claude.json` (user-scoped):

```json
{
  "mcpServers": {
    "apviso": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "apviso-mcp"],
      "env": {
        "APVISO_API_KEY": "apvk_your_key_here"
      }
    }
  }
}
```

For team projects, use environment variable expansion in `.mcp.json` so each developer uses their own key:

```json
{
  "mcpServers": {
    "apviso": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "apviso-mcp"],
      "env": {
        "APVISO_API_KEY": "${APVISO_API_KEY}"
      }
    }
  }
}
```

### 3. Verify

Run `/mcp` inside Claude Code to check the server status.

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APVISO_API_KEY` | Yes | — | Your API key (starts with `apvk_`) |
| `APVISO_API_URL` | No | `https://apviso.com/api` | API base URL |

## Tools

### Targets

| Tool | Description |
|------|-------------|
| `list_targets` | List all registered targets |
| `get_target` | Get target details |
| `create_target` | Register a new domain |
| `verify_target` | Verify domain ownership (DNS, file, or meta tag) |
| `get_verification_instructions` | Get verification steps for a target |
| `delete_target` | Remove a target |

### Scans

| Tool | Description |
|------|-------------|
| `list_scans` | List scans with optional status filter |
| `get_scan` | Get scan details and status |
| `create_scan` | Start a new penetration test (costs credits) |

### Findings

| Tool | Description |
|------|-------------|
| `list_findings` | List vulnerabilities for a scan |
| `update_finding_status` | Mark findings as fixed, accepted risk, etc. |

### Reports

| Tool | Description |
|------|-------------|
| `get_report` | Get the full pentest report as markdown |

### Schedules

| Tool | Description |
|------|-------------|
| `list_schedules` | List recurring scan schedules |
| `get_schedule` | Get schedule details |
| `create_schedule` | Set up recurring scans (Business/Enterprise) |
| `update_schedule` | Modify a schedule |
| `delete_schedule` | Remove a schedule |

### Quota

| Tool | Description |
|------|-------------|
| `get_quota` | Check remaining credits and billing period |

## License

MIT
