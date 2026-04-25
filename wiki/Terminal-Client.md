# Terminal Client

The terminal client is a TUI application built with the [`blessed`](https://github.com/chjj/blessed) library. It provides a real-time commit status dashboard inside a terminal emulator.

---

## Launch

```bash
gate-keeper client-terminal
```

The server must already be running. The terminal client connects to the WebSocket server at `ws://localhost:<wsPort>`.

---

## File Layout

| File | Role |
|------|------|
| `src/index.js` | CLI dispatch — routes `client-terminal` command to the shim |
| `src/client-terminal.mjs` | Thin shim that re-exports from `src/terminal/client-terminal.mjs` |
| `src/terminal/client-terminal.mjs` | Full TUI implementation |

---

## UI Layout

```
┌─────────────────────── Gate Keeper ────────────────────── [WS: Connected] ─┐
│                                                                              │
│  ┌────────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │                            │  │  System Feed                           │ │
│  │    ✓ READY TO COMMIT       │  │                                        │ │
│  │                            │  │  [12:34:56.789] ✓ Lint: All OK        │ │
│  │                            │  │  [12:34:55.001] ✓ Tests: 42 passed    │ │
│  └────────────────────────────┘  │  [12:34:54.000] Checking...           │ │
│                                  └────────────────────────────────────────┘ │
│                             Press q or Esc to exit                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Panels

### Header

Full-width bar at the top showing:
- **Left:** "Gate Keeper" title.
- **Right:** WebSocket connection status badge.

Badge states:

| State | Color | Text |
|-------|-------|------|
| Connected | Green | `WS: Connected` |
| Connecting | Yellow | `WS: Connecting...` |
| Disconnected | Red | `WS: Disconnected` |

### Commit Status Panel (left, 50%)

Large text block showing the gate decision:

| State | Color | Text |
|-------|-------|------|
| `canCommit: true` | Green | `✓ READY TO COMMIT` |
| `canCommit: false` | Red | `✗ COMMIT BLOCKED` |
| `inProgress: true` | Yellow | `⟳ CHECKING...` |

### System Feed Panel (right, 50%)

Scrollable log of events. Newest entries appear at the **top** (log prepend). Each entry is a single line with a timestamp and message.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `q` | Exit |
| `Esc` | Exit |
| `Ctrl-C` | Exit |

---

## WebSocket Connection

The terminal client uses the same WebSocket protocol as the browser client. See [WebSocket Protocol](WebSocket-Protocol.md) for the full message specification.

### Connection Flow

```
terminal starts
      │
      ▼
ws = new WebSocket('ws://localhost:9001')
      │
      ├─ onopen   → send FIRST_RUN, update header badge
      ├─ onmessage
      │     └─ STATUS_UPDATE → updateCommitStatus(), appendLog()
      ├─ onerror  → update header badge to error state
      └─ onclose  → update header badge, schedule reconnect in 5s
```

### Reconnection

On close or error, a 5-second timer reconnects. The badge shows "Connecting..." during the wait. No exponential backoff.

---

## `blessed` Widget Tree

```
screen
├── headerBox          (top: 0, height: 3)
├── statusBox          (top: 3, width: 50%, height: 100%-6)
├── feedBox            (top: 3, left: 50%, height: 100%-6)
└── footerBox          (bottom: 0, height: 3)
```

All boxes use `blessed`'s border and padding options. The screen is rendered with `screen.render()` after every state change.

---

## Implementation Notes

### Log Prepend

`blessed` does not natively support log prepend. The feed box's content is managed as an array of strings. On each new message, the new string is unshifted to the front of the array and the box content is set in full.

### Color Codes

`blessed` accepts both ANSI escape codes and its own `{color-fg}text{/color-fg}` tag syntax. The terminal client uses the tag syntax for portability across terminal emulators.

### Process Exit

All key bindings call `process.exit(0)`. The `blessed` screen is destroyed automatically when the process exits.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Blank screen on start | Terminal too small | Resize terminal to at least 80×24 |
| `WS: Disconnected` immediately | Server not running | Start with `gate-keeper server` |
| Garbled display | Incompatible terminal emulator | Use xterm, iTerm2, Windows Terminal |
| Colors look wrong | Terminal doesn't support 256 colors | Set `TERM=xterm-256color` |
