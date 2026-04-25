# Architecture

This page documents Gate Keeper's internal architecture: component boundaries, data flow, process topology, and design decisions.

---

## Bird's-Eye View

Gate Keeper is a single-process Node.js daemon that owns three server sockets and exposes a shared in-memory state to all of them.

```
┌──────────────────────────────────────────────────────────────┐
│  GATE KEEPER PROCESS                                         │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Express     │  │ WebSocket    │  │ MCP Server        │  │
│  │ :9000 HTTPS │  │ :9001 WSS   │  │ :9002 HTTP        │  │
│  └──────┬──────┘  └──────┬───────┘  └─────────┬─────────┘  │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                          │ reads / writes                   │
│                  ┌───────▼────────┐                         │
│                  │  State (singleton)                        │
│                  │  canCommit, inProgress, scripts[]         │
│                  └───────┬────────┘                         │
│                          │                                   │
│                  ┌───────▼────────┐                         │
│                  │ execute_scripts│                         │
│                  │ child_process  │                         │
│                  └───────┬────────┘                         │
│                          │ spawns                            │
│                  ┌───────▼────────┐                         │
│                  │  Shell scripts │                         │
│                  │  (user-defined)│                         │
│                  └────────────────┘                         │
└──────────────────────────────────────────────────────────────┘

External consumers:
  Browser     →  HTTPS :9000  (static files + REST)
              →  WSS   :9001  (live feed)
  Terminal    →  WSS   :9001
  AI Agent    →  HTTP  :9002  (MCP protocol)
  Git hook    →  HTTPS :9000  GET /cancommit
```

---

## Component Responsibilities

### Entry Point — `src/index.js`

The npm binary shim. Contains no logic: immediately delegates to `src/server/index.mjs` using a dynamic `import()`. Required because npm binaries resolve via CommonJS, while the entire codebase uses ES modules.

### Server Launcher — `src/server/index.mjs`

1. Parses raw `process.argv`.
2. Loads configuration via `load_config`.
3. Validates configuration shapes.
4. Starts Express server (`server_conf.mjs`).
5. Executes the first script run (`execute_scripts.mjs`).
6. Starts WebSocket server (`server_ws.mjs`).
7. Starts MCP server (`mcp_server.mjs`).
8. Optionally opens browser (via `open` package, WSL-path-aware).

### State Machine — `src/libs/state.mjs`

**The single source of truth.** All three servers read from and write to this singleton. It is a plain JavaScript object wrapped in a module, not a class, making it naturally a process-level singleton.

```
State shape:
{
  canCommit:  boolean,   // aggregate commit readiness
  inProgress: boolean,   // scripts currently executing
  scripts:    Script[]   // per-script name/command/result/data
}
```

State transitions:
- `setWorking(true)` — called before script execution begins
- `setWorking(false)` — called after all scripts complete
- `setScripts(scripts)` — replaces script array
- `updateScript(name, result, data)` — patches one script entry
- `setCanCommit(value)` — explicit override (used by `canCommit` lib)

### Script Execution — `src/libs/execute_scripts.mjs`

Runs all configured scripts as Node.js `child_process.exec` calls, collected into `Promise.all`. Each script writes its exit-code outcome and stdout/stderr into State via `updateScript`. Fatal errors call `process.exit(1)`.

### Config Loader — `src/libs/load_config.mjs`

Attempts to read `gate-keeper.conf.json` from `process.cwd()`. On not-found, falls back to the package-bundled `default.gate-keeper.conf.json`. Validates that `scripts` is a non-empty array. Merges environment variable overrides.

### Commit Decision — `src/libs/scripts_check.mjs`

Iterates `scripts[]` returned from state. Returns `false` if any script has `result === false`. Consumed by the `/cancommit` REST endpoint and broadcast messages.

---

## Data Flow: Script Execution Cycle

```
Trigger (RE_CHECK message or server start)
        │
        ▼
state.setWorking(true)
broadcast(STATUS_UPDATE {inProgress: true})
        │
        ▼
executeAllScripts(config.scripts)
  ├─ exec(script1.command)
  ├─ exec(script2.command)
  └─ exec(scriptN.command)  ← all concurrent via Promise.all
        │
        ▼  (all settled)
state.setWorking(false)
state.setScripts(results)
state.setCanCommit(canCommit(scripts))
broadcast(STATUS_UPDATE {canCommit, scripts, inProgress: false})
```

---

## Data Flow: Client Connection

```
Browser / Terminal opens WebSocket connection
        │
        ▼
ws.onconnection handler
  └─ send(connection welcome message)
  └─ send(current STATUS_UPDATE snapshot)
        │
        ▼
Client renders initial state
        │
        ▼                        (ongoing)
Server broadcasts STATUS_UPDATE on every state change
Client updates UI reactively
```

---

## Port Topology

| Port | Service | Protocol | Configurable via |
|------|---------|----------|-----------------|
| 9000 | Express (REST + static) | HTTPS or HTTP | `GATE_KEEPER_PORT` / config `port` |
| 9001 | WebSocket | WSS or WS | `GATE_KEEPER_WS_PORT` |
| 9002 | MCP | HTTP | `GATE_KEEPER_MCP_PORT` |

The web client discovers the WebSocket port dynamically by calling `GET /ws-port` on the Express server. This avoids hardcoding the port in the static bundle.

---

## HTTPS Strategy

Self-signed certificates are generated on every server start using the `selfsigned` package. There is no certificate persistence between restarts. This is intentional for developer ergonomics — no setup required, but browsers will show a security warning on first visit.

For production or shared environments, replace `server_conf.mjs` certificate generation with actual certificates and set `GATE_KEEPER_HTTPS=false` if terminating TLS upstream.

---

## Process Lifecycle

```
gate-keeper server
      │
      ├─ load config
      ├─ start Express        (sync, throws on port conflict)
      ├─ first script run     (async, sets inProgress)
      ├─ start WebSocket      (sync)
      ├─ start MCP            (sync)
      └─ run forever (event loop kept alive by servers)

SIGTERM / SIGINT
      └─ Node default behavior (process exits, sockets close)
```

There is no graceful shutdown handler — the process exits abruptly on signal. Clients detect disconnect and attempt reconnection automatically.

---

## Module System

The project uses **ES Modules** throughout (`"type": "module"` in `package.json`). All `src/` and `test/` files use `.mjs` extension or the package-level module type. The single exception is `src/index.js` (CommonJS `.js` extension required by npm bin resolution).

Dynamic `import()` bridges the CJS entry point to the ESM codebase.

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Single process with all servers | Shared in-memory state without IPC complexity |
| Singleton state module | Avoids passing state as function argument across module tree |
| `Promise.all` for scripts | Maximises throughput; order doesn't matter for the gate decision |
| Self-signed certs auto-generated | Zero-config for developers |
| MCP on separate port | Allows binding MCP to localhost-only independently |
| No database / persistence | State is ephemeral by design; only current run matters |
| Vanilla JS frontend | No build step, no bundler, no framework dependencies |
