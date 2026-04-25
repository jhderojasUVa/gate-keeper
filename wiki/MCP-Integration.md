# MCP Integration

Gate Keeper implements an [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server, allowing AI coding assistants to query the current commit readiness as a structured tool call.

---

## Why MCP?

MCP is a standard interface for AI agents to discover and invoke capabilities exposed by external services. By implementing MCP, Gate Keeper enables:

- **Claude** (Anthropic) to check gate status before suggesting changes.
- **GitHub Copilot** and other MCP-compatible clients to incorporate commit safety into their workflows.
- Custom AI agents to automate commit decisions.

---

## Server Details

| Property | Value |
|----------|-------|
| Port | `9002` (default, override with `GATE_KEEPER_MCP_PORT`) |
| Protocol | HTTP (not HTTPS) |
| Binding | `127.0.0.1` only |
| Transport | MCP Streamable HTTP |
| SDK | `@modelcontextprotocol/sdk` v1.29 |

---

## Endpoints

### `POST /mcp`

The MCP protocol endpoint. All tool invocations from AI agents are sent here.

**Content-Type:** `application/json`

**Request body:** standard MCP JSON-RPC request.

**Response:** MCP JSON-RPC response with the tool result.

---

### `GET /status`

A lightweight non-MCP status endpoint for diagnostics and health checks.

```bash
curl http://localhost:9002/status
```

```json
{
  "canCommit": true,
  "inProgress": false,
  "scripts": [...]
}
```

---

### `GET /mcp` and `DELETE /mcp`

Both return `405 Method Not Allowed` with an `Allow: POST` header. These are required by the MCP spec to signal the correct method to clients.

---

## Exposed Tool: `get_gate_keeper_status`

### Description

Returns the current Gate Keeper status.

### Input Schema

No required parameters. The tool accepts an empty object `{}`.

### Output

```json
{
  "canCommit": true,
  "inProgress": false,
  "scripts": [
    {
      "name": "Lint",
      "command": "npm run lint",
      "result": true,
      "data": "All files OK"
    },
    {
      "name": "Tests",
      "command": "npm test",
      "result": false,
      "data": "AssertionError: expected 3 to equal 4"
    }
  ],
  "summary": "1 script(s) failed. Commit is blocked."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `canCommit` | `boolean` | Overall gate decision |
| `inProgress` | `boolean` | Scripts are still running |
| `scripts` | `Script[]` | Per-script results |
| `summary` | `string` | Human-readable sentence for AI context |

The `summary` field is designed to be injected into an AI agent's chain-of-thought so it can reason about commit safety without parsing the full script array.

---

## Client Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "gate-keeper": {
      "url": "http://localhost:9002/mcp"
    }
  }
}
```

Restart Claude Desktop. Gate Keeper must be running for the tool to appear.

### VS Code / GitHub Copilot

If your Copilot version supports MCP servers, add to `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "gate-keeper": {
      "type": "http",
      "url": "http://localhost:9002/mcp"
    }
  }
}
```

### Custom Agent (Node.js)

```js
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const client = new Client({ name: 'my-agent', version: '1.0.0' });
const transport = new StreamableHTTPClientTransport(
  new URL('http://localhost:9002/mcp')
);

await client.connect(transport);

const result = await client.callTool({
  name: 'get_gate_keeper_status',
  arguments: {}
});

console.log(result.content[0].text);
// → JSON string with canCommit, scripts, summary
```

---

## Stateless Request Model

Each MCP request is handled statelessly:

1. Request arrives at `POST /mcp`.
2. A new `McpServer` instance is created.
3. The `get_gate_keeper_status` tool is registered on this instance.
4. A `StreamableHTTPServerTransport` is created for this request.
5. The server connects to the transport, handles the request, returns a response.
6. The server is immediately closed and garbage collected.

No session state is stored between requests. Gate Keeper's actual application state (scripts, canCommit) lives in the process-level state singleton — the MCP layer simply reads from it.

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| External access | Server binds to `127.0.0.1` only |
| DNS rebinding | `Host` header validated to `127.0.0.1` / `localhost` |
| Authentication | None — trust derived from network access |
| Data sensitivity | Scripts output is included in responses; avoid running scripts that print secrets |

> **Warning:** Do not expose port 9002 beyond localhost. Gate Keeper's MCP server has no authentication layer.

---

## Extending the MCP Server

To add additional MCP tools, edit `src/server/mcp_server.mjs`:

```js
server.tool(
  'my_new_tool',
  {
    description: 'What this tool does',
    inputSchema: {
      type: 'object',
      properties: {
        myParam: { type: 'string', description: 'A parameter' }
      }
    }
  },
  async ({ myParam }) => {
    // Tool logic here
    return {
      content: [{ type: 'text', text: JSON.stringify({ result: myParam }) }]
    };
  }
);
```

Follow the same stateless pattern — do not store state on the `McpServer` instance.
