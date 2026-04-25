# CLI Reference

Gate Keeper exposes two CLI binaries defined in `package.json`:

| Binary | Entry Point | Purpose |
|--------|-------------|---------|
| `gate-keeper` | `src/index.js` | Main daemon and client commands |
| `gate-keeper-init` | `src/init.mjs` | Project initialisation |

---

## `gate-keeper`

### Synopsis

```
gate-keeper <command> [options]
```

### Commands

#### `server`

Start the Gate Keeper background service.

```bash
gate-keeper server
gate-keeper server --open
```

| Flag | Description |
|------|-------------|
| `--open` | After the server starts, automatically open the web dashboard in the default browser |

**What it does:**

1. Reads `gate-keeper.conf.json` (or the bundled default).
2. Starts the Express HTTPS server on the configured port (default 9000).
3. Runs all configured scripts once.
4. Starts the WebSocket server (default 9001).
5. Starts the MCP HTTP server (default 9002).
6. Keeps running until the process is killed.

**Exit codes:**

| Code | Meaning |
|------|---------|
| 0 | Process killed normally (SIGTERM/SIGINT) |
| 1 | Fatal error (port conflict, invalid config, script execution failure) |

---

#### `client`

Open the web dashboard in the default browser without starting the server.

```bash
gate-keeper client
```

Navigates to `https://localhost:<port>` (resolved from the running server's port). The server must already be running for the dashboard to be useful.

On WSL, the path is automatically converted to the Windows browser equivalent via `wsl.bat`.

---

#### `client-terminal`

Launch the blessed TUI client in the current terminal.

```bash
gate-keeper client-terminal
```

Connects to the WebSocket server at `ws://localhost:<wsPort>`. Displays real-time commit status and script output in a split-panel terminal UI.

**Keyboard shortcuts:**

| Key | Action |
|-----|--------|
| `q` | Quit |
| `Esc` | Quit |
| `Ctrl-C` | Quit |

See [Terminal Client](Terminal-Client.md) for UI details.

---

#### `--help`

```bash
gate-keeper --help
```

Prints usage information.

---

#### `--version`

```bash
gate-keeper --version
```

Prints the current version (read from `package.json`).

---

## `gate-keeper-init`

### Synopsis

```
gate-keeper-init [options]
```

### Description

Creates a `gate-keeper.conf.json` file in the current working directory.

If `gate-keeper.conf.json` already exists, the command aborts with an error to prevent accidental overwrites.

| Flag | Description |
|------|-------------|
| `--open` | After initialising config, start the server and open the browser |

### Example

```bash
cd my-project
gate-keeper-init
# → creates gate-keeper.conf.json
```

Generated file:

```json
{
  "port": 9000,
  "host": "localhost",
  "scripts": [
    {
      "name": "List files",
      "command": "ls"
    }
  ]
}
```

Edit the `scripts` array to add your actual quality checks.

---

## npm Scripts

When working in the Gate Keeper repository itself, these npm scripts are available:

| Script | Command | Description |
|--------|---------|-------------|
| `lint` | `eslint .` | Run ESLint across all files |
| `lint:fix` | `eslint . --fix` | Auto-fix ESLint violations |
| `test` | `vitest run --coverage` | Run full test suite with coverage |
| `test:unit` | `vitest run` | Run tests without coverage |
| `prepare` | `husky` | Install Git hooks (runs automatically on `npm install`) |
| `cz` | `cz` | Interactive Commitizen commit wizard |
| `release` | `standard-version` | Auto-detect version bump from commits |
| `release:minor` | `standard-version --release-as minor` | Force minor bump |
| `release:patch` | `standard-version --release-as patch` | Force patch bump |
| `release:major` | `standard-version --release-as major` | Force major bump |

---

## Environment Variables Affecting CLI

All variables documented in [Configuration § Environment Variables](Configuration.md#environment-variables) are read by the CLI at process start. Set them before invoking the command:

```bash
GATE_KEEPER_PORT=8080 GATE_KEEPER_HTTPS=false gate-keeper server --open
```
