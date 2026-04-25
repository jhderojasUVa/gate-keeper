# Server Components

This page provides deep technical documentation for the three servers that Gate Keeper runs: the Express HTTP(S) server, the WebSocket server, and the MCP server.

---

## Express Server (`src/server/server_conf.mjs`)

### Responsibilities

- Serve the web dashboard static files from `public/`.
- Expose REST endpoints for external callers (Git hooks, scripts, health checks).
- Optionally terminate TLS with auto-generated self-signed certificates.

### Exported Symbols

| Export | Type | Description |
|--------|------|-------------|
| `express_app` | Express Application | The bare Express instance |
| `express_server` | `http.Server \| https.Server` | The listening server returned by `.listen()` |
| `express_port` | `number` | Resolved port (from config or env) |
| `isHTTPS` | `boolean` | Whether TLS is active |

### REST Endpoints

#### `GET /cancommit`

Returns the current commit gate decision.

**Response:**

```json
{ "cancommit": true }
```

or

```json
{ "cancommit": false }
```

**Status:** always `200 OK`.

Designed to be polled by Git hooks without authentication. The decision is read directly from the in-memory state singleton.

---

#### `GET /status`

Returns a full snapshot of the current state.

**Response:**

```json
{
  "canCommit": true,
  "inProgress": false,
  "scripts": [
    {
      "name": "Lint",
      "command": "npm run lint",
      "result": true,
      "data": "... stdout/stderr output ..."
    }
  ]
}
```

**Status:** always `200 OK`.

---

#### `GET /ws-port`

Returns the WebSocket server port. Used by the web client on page load so the port does not need to be hardcoded in the static bundle.

**Response:**

```json
{ "port": 9001 }
```

---

### HTTPS Configuration

When `GATE_KEEPER_HTTPS=true` (default), the server generates a self-signed certificate on every start using the `selfsigned` package:

```js
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });
https.createServer({ key: pems.private, cert: pems.cert }, app);
```

Certificates are not saved to disk and regenerate on restart. Clients (browsers, `curl`, custom scripts) must either:
- Accept the self-signed certificate interactively, or
- Use `curl -k` / `--insecure`, or
- Set `GATE_KEEPER_HTTPS=false` to use plain HTTP.

---

### Static Files

Express serves everything in `public/` as static assets. The entry point is `public/index.html`. Assets are served without authentication.

---

## WebSocket Server (`src/server/server_ws.mjs`)

### Responsibilities

- Maintain persistent connections with browser clients and terminal clients.
- Push real-time state updates whenever scripts finish executing.
- Accept control messages from clients to trigger re-runs.

### Exported Symbols

| Export | Type | Description |
|--------|------|-------------|
| `wss` | `WebSocket.Server` | The `ws` server instance |
| `broadcast` | `function(message: string): void` | Send a message to all connected clients |

### Server Initialisation

The WebSocket server is created on a standalone TCP port (default 9001), not attached to the Express server. This means HTTPS on 9000 does not automatically protect the WebSocket channel. In production, place both behind a reverse proxy (e.g. nginx) that handles TLS for both.

```js
const wss = new WebSocket.Server({ port: wsPort });
```

### Connection Lifecycle

```
client connects
      │
      ▼
send: connection welcome message (WSResponse)
send: current STATUS_UPDATE snapshot
      │
      ▼
client message received
      │
      ├─ RE_CHECK     → re-run all scripts
      ├─ FIRST_RUN   → alias for RE_CHECK
      ├─ EXIT        → close this client connection
      └─ FATAL_ERROR → log + close connection
      │
      ▼
client disconnects (or error)
      └─ remove from clients Set
```

### `broadcast(message)`

Iterates the `clients` Set and sends `message` to every client whose `readyState === WebSocket.OPEN`. Clients in any other state are silently skipped.

```js
broadcast(JSON.stringify({ type: 'STATUS_UPDATE', ...state.getStatus() }));
```

### Message Handling

All incoming messages are expected to be JSON strings. The `type` field is compared against the `TYPES_MESSAGES` enum. Unknown types are logged and ignored.

See [WebSocket Protocol](WebSocket-Protocol.md) for the complete message specification.

---

## MCP Server (`src/server/mcp_server.mjs`)

### What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) is an open standard that allows AI agents (Claude, Copilot, custom agents) to discover and call structured tools exposed by a server. Gate Keeper implements an MCP server so that AI assistants can check commit readiness before suggesting code changes.

### Responsibilities

- Expose a single MCP tool: `get_gate_keeper_status`.
- Accept stateless per-request connections on port 9002.
- Enforce localhost-only binding for security.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/status` | Plain JSON status (non-MCP, for quick diagnostics) |
| `POST` | `/mcp` | MCP protocol handler — all tool calls go here |
| `GET` | `/mcp` | Returns 405 Method Not Allowed |
| `DELETE` | `/mcp` | Returns 405 Method Not Allowed |

### MCP Tool: `get_gate_keeper_status`

**Description:** Returns the current Gate Keeper status including whether a commit is allowed.

**Input schema:** No required parameters.

**Output:**

```json
{
  "canCommit": true,
  "inProgress": false,
  "scripts": [
    {
      "name": "Lint",
      "result": true,
      "data": "stdout/stderr here"
    }
  ],
  "summary": "All scripts passed. Commit is allowed."
}
```

The `summary` field is a human-readable sentence suitable for inclusion in an AI agent's reasoning context.

### Stateless Architecture

Each MCP request creates a new `McpServer` instance, handles the request, and disposes it. There is no session state. This matches the MCP streamable-HTTP transport pattern.

```js
// Pseudocode of the handler
app.post('/mcp', async (req, res) => {
  const server = new McpServer({ name: 'gate-keeper', version });
  server.tool('get_gate_keeper_status', schema, handler);
  const transport = new StreamableHTTPServerTransport(...);
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
  await server.close();
});
```

### Security Considerations

- The MCP server binds to `127.0.0.1` by default. Do not expose port 9002 externally.
- No authentication is implemented. Trust is based on network access (localhost-only).
- The `Host` header is validated to reject DNS rebinding attacks — only `127.0.0.1` and `localhost` are accepted.

### Integrating with Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gate-keeper": {
      "url": "http://localhost:9002/mcp"
    }
  }
}
```

Gate Keeper must be running (`gate-keeper server`) for Claude to discover the tool.

---

## Server Startup Sequence (`src/server/index.mjs`)

The launcher coordinates all three servers:

```js
const config = await loadConfig();
const { express_server, express_port } = await startExpress(config);
await executeAllScripts(config.scripts);       // initial run
const wsServer = await startWebSocket(config);
const mcpServer = await startMCP(config);

// If --open flag provided:
await openBrowser(`https://localhost:${express_port}`);
```

All three servers start before the first script execution completes. Clients connecting during the initial run receive `inProgress: true` in their welcome snapshot.

---

## Response Interfaces

### `src/server/response.interface.mjs`

`WSResponse(message: any): string` — JSON-stringifies a message for WebSocket transmission.

### `src/server/responses/server_responses.mjs`

Pre-built response factory used throughout the WebSocket server:

```js
connection          // Sent on new client connection
response(type, payload)  // Generic typed message factory
canCommit(value)    // Boolean gate message
```

See [WebSocket Protocol](WebSocket-Protocol.md) for the complete type catalogue.
