# WebSocket Protocol

This page specifies all WebSocket message types, direction, payload shapes, and the connection lifecycle used by Gate Keeper.

---

## Connection Details

| Property | Value |
|----------|-------|
| Default port | `9001` |
| Protocol | `ws://` (unencrypted by default) |
| Message format | JSON string |
| Transport | Standalone `ws` server (not HTTP upgrade on Express) |

The web client discovers the port by calling `GET /ws-port` on the Express server before connecting. Terminal clients use the configured port directly.

---

## Message Types (`TYPES_MESSAGES`)

Defined in `src/models/wsServerRequest.model.mjs`:

| Type | Initiator | Description |
|------|-----------|-------------|
| `RE_CHECK` | Client → Server | Trigger a full re-run of all configured scripts |
| `FIRST_RUN` | Client → Server | Alias for `RE_CHECK`; semantically "I just connected, run checks" |
| `STATUS_UPDATE` | Server → Client | State broadcast after a script cycle completes |
| `STILL_WORKING` | Server → Client | Intermediate heartbeat during a long-running execution |
| `ERROR` | Server → Client | Non-fatal error notification |
| `EXIT` | Client → Server | Request the server to close this connection |
| `FATAL_ERROR` | Client → Server | Client reports an unrecoverable local error |
| `UNKNOW` | — | Fallback type for unrecognized messages |

---

## Message Shapes

### Server → Client: Welcome (on connection)

Sent immediately when a client connects, before the status snapshot.

```json
{
  "type": "connection",
  "message": "Connected to Gate Keeper"
}
```

### Server → Client: `STATUS_UPDATE`

Sent after every script execution cycle and immediately to new connections.

```json
{
  "type": "STATUS_UPDATE",
  "canCommit": true,
  "inProgress": false,
  "scripts": [
    {
      "name": "Unit tests",
      "command": "npm test",
      "result": true,
      "data": "Test suite passed (42 tests)"
    },
    {
      "name": "Lint",
      "command": "npm run lint",
      "result": false,
      "data": "error: no-unused-vars at src/foo.js:12"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `canCommit` | `boolean` | `true` if all scripts passed |
| `inProgress` | `boolean` | `true` while scripts are executing |
| `scripts` | `Script[]` | Per-script results (see below) |

**Script object:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Display name from config |
| `command` | `string` | Shell command from config |
| `result` | `boolean \| null` | `true` = pass, `false` = fail, `null` = not yet run |
| `data` | `string \| null` | Captured stdout + stderr |

### Server → Client: `STILL_WORKING`

Intermediate update while scripts are running but not yet complete.

```json
{
  "type": "STILL_WORKING",
  "inProgress": true
}
```

### Server → Client: `ERROR`

Non-fatal server-side error.

```json
{
  "type": "ERROR",
  "message": "Description of the error"
}
```

### Client → Server: `RE_CHECK`

```json
{ "type": "RE_CHECK" }
```

Triggers `executeAllScripts()` → state update → `STATUS_UPDATE` broadcast to all clients.

### Client → Server: `FIRST_RUN`

```json
{ "type": "FIRST_RUN" }
```

Semantically identical to `RE_CHECK`. Sent by clients on initial connection to get the latest status immediately.

### Client → Server: `EXIT`

```json
{ "type": "EXIT" }
```

Server closes the WebSocket connection for this client cleanly.

### Client → Server: `FATAL_ERROR`

```json
{
  "type": "FATAL_ERROR",
  "message": "Optional error description"
}
```

Server logs the error and closes the connection.

---

## Connection Lifecycle

```
CLIENT                                SERVER
  │                                      │
  │──── TCP connect to :9001 ───────────▶│
  │                                      │ add to clients Set
  │◀─── { type: "connection", ... } ─────│
  │◀─── STATUS_UPDATE (current state) ───│
  │                                      │
  │──── { type: "FIRST_RUN" } ──────────▶│
  │                                      │ executeAllScripts()
  │◀─── STATUS_UPDATE (inProgress:true) ─│  (broadcast to all)
  │                                      │   ... scripts running ...
  │◀─── STATUS_UPDATE (results) ─────────│  (broadcast to all)
  │                                      │
  │──── { type: "RE_CHECK" } ───────────▶│
  │                                      │ executeAllScripts() again
  │◀─── STATUS_UPDATE ... ───────────────│
  │                                      │
  │──── { type: "EXIT" } ───────────────▶│
  │                                      │ ws.close()
  │◀─── TCP close ────────────────────── │
```

---

## Reconnection Behaviour

Both the web client and terminal client implement automatic reconnection:

- On `ws.onclose` or `ws.onerror`, schedule reconnect after **5 seconds**.
- On reconnect, send `FIRST_RUN` to get the latest state.
- No exponential backoff — fixed 5-second interval.

If the server is not running, reconnect attempts continue indefinitely until the user closes the client.

---

## Implementing a Custom Client

Minimal example (Node.js):

```js
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9001');

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'FIRST_RUN' }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'STATUS_UPDATE') {
    console.log('Can commit:', msg.canCommit);
    console.log('In progress:', msg.inProgress);
    for (const script of msg.scripts) {
      const icon = script.result === true ? '✓' : script.result === false ? '✗' : '?';
      console.log(`  ${icon} ${script.name}`);
    }
  }
});

ws.on('close', () => {
  setTimeout(() => reconnect(), 5000);
});
```

---

## Security Notes

- The WebSocket server does not require authentication.
- It is intended for local developer use only. Do not expose port 9001 on a shared or public network.
- All messages are plaintext JSON — do not transmit sensitive data via Gate Keeper scripts.
