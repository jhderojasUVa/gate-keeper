# Gate Keeper — Developer Wiki

**Gate Keeper** is a Node.js pre-commit code quality guardian. It runs as a background service that executes configurable shell scripts, aggregates their results, and exposes a single source of truth: _is this codebase safe to commit?_

---

## Table of Contents

| Page | Description |
|------|-------------|
| [Architecture](Architecture.md) | System design, component map, data flow |
| [Getting Started](Getting-Started.md) | Installation, first run, quick-start guide |
| [Configuration](Configuration.md) | `gate-keeper.conf.json` and environment variables |
| [CLI Reference](CLI-Reference.md) | All CLI commands and flags |
| [Server Components](Server-Components.md) | Express, WebSocket, MCP — deep dive |
| [WebSocket Protocol](WebSocket-Protocol.md) | Message types, event flow, client integration |
| [MCP Integration](MCP-Integration.md) | AI agent interface via Model Context Protocol |
| [Web UI](Web-UI.md) | Browser dashboard internals |
| [Terminal Client](Terminal-Client.md) | TUI client internals |
| [Data Models](Data-Models.md) | All data structures and type contracts |
| [Libraries](Libraries.md) | Utility libraries — state, execution, logging |
| [Testing Guide](Testing-Guide.md) | Test setup, patterns, coverage requirements |
| [Contributing](Contributing.md) | Workflow, commit conventions, release process |
| [CI/CD](CI-CD.md) | GitHub Actions workflows explained |

---

## What Gate Keeper Does

```
git commit  →  pre-commit hook  →  gate-keeper instance running?
                                        │ yes
                                        ↓
                               GET /cancommit
                                        │
                          {cancommit: true}  →  commit proceeds
                          {cancommit: false} →  commit blocked
```

The service continuously re-runs scripts defined in `gate-keeper.conf.json`. Any failure flips `canCommit` to `false`. All three interfaces (Web UI, Terminal, MCP) reflect the same authoritative state held in the singleton state machine.

---

## Interfaces at a Glance

| Interface | Port | Protocol | Use Case |
|-----------|------|----------|----------|
| Web Dashboard | 9000 | HTTPS | Human monitoring |
| WebSocket Feed | 9001 | WSS | Real-time updates |
| MCP Server | 9002 | HTTP | AI agent access |
| REST API | 9000 | HTTPS | `GET /cancommit`, `GET /status` |

---

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Runtime | Node.js 20+ |
| HTTP server | Express.js |
| WebSocket | `ws` library |
| Terminal UI | `blessed` |
| HTTPS certs | `selfsigned` (dev-grade, auto-generated) |
| MCP protocol | `@modelcontextprotocol/sdk` v1.29 |
| Tests | Vitest |
| Linting | ESLint (flat config) |
| Commits | Commitizen + conventional commits |
| Releases | `standard-version` |

---

## Repository Layout

```
gate-keeper/
├── src/
│   ├── index.js                # npm bin entry point
│   ├── init.mjs                # gate-keeper-init CLI
│   ├── client-terminal.mjs     # Terminal client shim
│   ├── libs/                   # Business logic utilities
│   ├── models/                 # Data shape definitions
│   ├── server/                 # HTTP / WS / MCP servers
│   └── terminal/               # blessed TUI client
├── public/                     # Static web dashboard assets
├── test/                       # Vitest test suite
├── .github/workflows/          # CI/CD pipelines
├── default.gate-keeper.conf.json
└── wiki/                       # ← you are here
```

---

## Version

Current release: **v1.2.0** (2026-04-25). See [CHANGELOG](../CHANGELOG.md) for full history.
