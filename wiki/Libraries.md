# Libraries

The `src/libs/` directory contains all business logic that is independent of HTTP, WebSocket, or MCP transport concerns. These modules are imported by the server layer and can be tested in isolation.

---

## `state.mjs` — Application State

The **single source of truth** for the running Gate Keeper instance. Implemented as a module-level singleton: because ES module instances are cached, importing `state.mjs` anywhere in the same process always returns the same object.

### State Shape

```js
{
  canCommit:  boolean,    // false if any script.result === false
  inProgress: boolean,    // true while scripts are executing
  scripts:    Script[]    // current script results
}
```

### API

#### `getStatus()`

Returns a full snapshot of the current state.

```js
import { getStatus } from './state.mjs';
const { canCommit, inProgress, scripts } = getStatus();
```

#### `setWorking(value: boolean)`

Sets `inProgress`. Call with `true` before starting `executeAllScripts()` and `false` when complete.

```js
setWorking(true);
await executeAllScripts(config.scripts);
setWorking(false);
```

#### `setScripts(scripts: Script[])`

Replaces the entire `scripts` array. Called after a full execution cycle with the updated results.

#### `updateScript(name: string, result: boolean, data: string)`

Patches a single script by name. Used during execution to set per-script results as they complete (before `setScripts` is called with the final batch).

#### `setCanCommit(value: boolean)`

Explicitly sets the `canCommit` flag. Normally driven by `canCommit()` from `scripts_check.mjs`.

#### `reset()`

Resets state to initial values. Used in tests to ensure isolation between test cases.

> **Important for contributors:** Never mutate state directly. Always use the exported setter functions. This ensures all consumers (all three servers) observe consistent state transitions.

---

## `execute_scripts.mjs` — Script Executor

Runs all configured scripts concurrently as child processes.

### `executeAllScripts(scripts: Script[]): Promise<Script[]>`

Calls `child_process.exec` for every script in the array. All executions are started concurrently via `Promise.all`. Returns the same array with `result` and `data` populated.

```js
import { executeAllScripts } from './execute_scripts.mjs';

const results = await executeAllScripts(config.scripts);
// results[i].result: true | false
// results[i].data:   stdout + stderr string
```

**Exit behaviour:**
- If `exec` itself throws an unrecoverable error (e.g. `ENOMEM`), the error is logged and `process.exit(1)` is called.
- Script non-zero exit codes set `result = false` but do **not** exit the process.

**Concurrency:** All scripts start at the same time. There is no limit on concurrent processes. If your scripts are resource-intensive, consider sequencing them manually or adding a concurrency limit.

**Timeout:** No timeout is currently enforced. Long-running scripts will block `inProgress` indefinitely. Add a timeout via `child_process.exec`'s `options.timeout` if needed.

---

## `load_config.mjs` — Configuration Loader

Reads and validates the Gate Keeper configuration file.

### `loadConfig(): Promise<GateKeeperConfig>`

Resolution order:
1. `gate-keeper.conf.json` in `process.cwd()`.
2. `default.gate-keeper.conf.json` from the package root.

Applies environment variable overrides after loading:

```js
config.port = process.env.GATE_KEEPER_PORT ?? config.port;
config.wsPort = process.env.GATE_KEEPER_WS_PORT ?? (config.port + 1);
config.mcpPort = process.env.GATE_KEEPER_MCP_PORT ?? (config.port + 2);
```

**Validation errors** (throws with descriptive message):
- Config file not valid JSON.
- `scripts` is missing or not an array.
- `scripts` is empty.
- Any script missing `name` or `command`.

---

## `scripts_check.mjs` — Commit Decision

```js
import { canCommit } from './scripts_check.mjs';

const result = canCommit(scripts);
// → false if any script.result === false
// → true if all script.result === true or null
```

### `canCommit(scripts: Script[]): boolean`

Iterates the scripts array. Returns `false` if any entry has `result === false`. Returns `true` otherwise (including scripts with `result === null`, which means not yet run).

This function is used by:
- `GET /cancommit` REST endpoint.
- The `setCanCommit()` call after execution cycles.
- The MCP `summary` field generation.

---

## `log.mjs` — Logging

```js
import { expressLog } from './log.mjs';

expressLog({ message: 'Server started', kind: 'server', severity: 'info' });
```

### `expressLog(options)`

| Option | Type | Values | Description |
|--------|------|--------|-------------|
| `message` | `string` | any | Log message text |
| `kind` | `string` | `'server'`, `'ws'`, `'mcp'`, `'script'` | Source category shown as prefix |
| `severity` | `string` | `'info'`, `'warn'`, `'error'` | Determines console output color |

**Severity to color mapping** (via `colors.mjs`):
- `'info'` → white / default
- `'warn'` → yellow
- `'error'` → red

**Disk logging:**

If `GATE_KEEPER_LOG_ON_DISK=true`, messages are appended to the log file specified by `GATE_KEEPER_LOG_FILE` (default: `gate-keeper.log` in cwd). The file is opened in append mode. Log file I/O errors are silently swallowed to avoid crashing on disk-full conditions.

---

## `colors.mjs` — ANSI Color Codes

A plain object exporting ANSI escape sequences for terminal output.

```js
import colors from './colors.mjs';

console.log(`${colors.red}Error!${colors.reset}`);
console.log(`${colors.bold}${colors.green}OK${colors.reset}`);
```

### Available Keys

| Key | Code | Effect |
|-----|------|--------|
| `reset` | `\x1b[0m` | Reset all attributes |
| `bold` | `\x1b[1m` | Bold text |
| `dim` | `\x1b[2m` | Dimmed text |
| `red` | `\x1b[31m` | Red foreground |
| `green` | `\x1b[32m` | Green foreground |
| `yellow` | `\x1b[33m` | Yellow foreground |
| `blue` | `\x1b[34m` | Blue foreground |
| `bgRed` | `\x1b[41m` | Red background |
| `bgGreen` | `\x1b[42m` | Green background |
| `bgYellow` | `\x1b[43m` | Yellow background |

---

## `app_utils.mjs` — Module Utilities

Helpers for ES module metadata that CommonJS provided natively.

### `__dirname`

```js
import { __dirname } from './app_utils.mjs';
```

Resolves the directory of the calling module. Equivalent to CommonJS `__dirname`. Built from `import.meta.url` using `fileURLToPath` and `path.dirname`.

### `version`

```js
import { version } from './app_utils.mjs';
// → "1.2.0"
```

The current package version read from `package.json` at import time. Used in the `--version` CLI flag and MCP server identity.
