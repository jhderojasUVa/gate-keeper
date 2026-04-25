# Configuration

Gate Keeper is configured via a JSON file and a set of environment variables. This page documents every available option.

---

## Configuration File

### Location and Resolution Order

Gate Keeper looks for a configuration file in this order:

1. `gate-keeper.conf.json` in the current working directory (`process.cwd()`)
2. `default.gate-keeper.conf.json` bundled inside the package (fallback)

If neither contains a valid `scripts` array, the process exits with an error.

### Creating the Config File

```bash
gate-keeper-init
```

This copies the default config to `gate-keeper.conf.json` in your project root.

---

## Full Schema

```json
{
  "port": 9000,
  "host": "localhost",
  "scripts": [
    {
      "name": "string — display name",
      "command": "string — shell command to execute"
    }
  ]
}
```

### `port`

| Type | Default | Description |
|------|---------|-------------|
| `number` | `9000` | TCP port for the Express HTTP(S) server |

Overridable at runtime via `GATE_KEEPER_PORT`. The WebSocket server runs on `port + 1` by default (9001) and the MCP server on `port + 2` (9002), unless overridden by their respective environment variables.

### `host`

| Type | Default | Description |
|------|---------|-------------|
| `string` | `"localhost"` | Hostname the Express server binds to |

Use `"0.0.0.0"` to bind to all interfaces (e.g. Docker, remote monitoring).

### `scripts`

| Type | Required | Description |
|------|----------|-------------|
| `array` | yes | One or more script definitions. Must not be empty. |

Each script object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | yes | Human-readable identifier shown in the UI and logs |
| `command` | `string` | yes | Shell command executed via `child_process.exec` |
| `data` | `string` | no | Populated at runtime with stdout/stderr output |
| `result` | `boolean \| null` | no | Populated at runtime: `true` = passed, `false` = failed, `null` = not yet run |

> **Note**: `data` and `result` are runtime fields. Do not set them in the config file — they are overwritten on every execution cycle.

---

## Default Configuration

The package ships with:

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

This is intentionally minimal so `gate-keeper-init` always produces a working config that users can build on.

---

## Environment Variables

All environment variables override corresponding config file values. They are read at server start and not watched for changes.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `GATE_KEEPER_PORT` | number | `9000` | Express server port |
| `GATE_KEEPER_WS_PORT` | number | `9001` | WebSocket server port |
| `GATE_KEEPER_MCP_PORT` | number | `9002` | MCP server port |
| `GATE_KEEPER_HTTPS` | boolean | `true` | Enable HTTPS with auto-generated self-signed cert |
| `GATE_KEEPER_LOG_ON_DISK` | boolean | `false` | Write log output to a file in addition to stdout |
| `GATE_KEEPER_LOG_FILE` | string | `gate-keeper.log` | Path for the disk log file (relative to cwd) |

### Setting Variables

```bash
# Inline
GATE_KEEPER_HTTPS=false gate-keeper server

# .env file (requires dotenv or similar)
GATE_KEEPER_PORT=8080
GATE_KEEPER_WS_PORT=8081
GATE_KEEPER_MCP_PORT=8082
GATE_KEEPER_HTTPS=false
GATE_KEEPER_LOG_ON_DISK=true
GATE_KEEPER_LOG_FILE=logs/gate-keeper.log
```

---

## Practical Examples

### Run tests and lint before every commit

```json
{
  "port": 9000,
  "host": "localhost",
  "scripts": [
    { "name": "Unit tests", "command": "npm test" },
    { "name": "ESLint", "command": "npm run lint" },
    { "name": "TypeScript", "command": "npx tsc --noEmit" }
  ]
}
```

### Multiple environments via env vars

```bash
# Development
gate-keeper server

# CI-like (no HTTPS, different port)
GATE_KEEPER_HTTPS=false GATE_KEEPER_PORT=9010 gate-keeper server

# Full logging to disk
GATE_KEEPER_LOG_ON_DISK=true GATE_KEEPER_LOG_FILE=.logs/gk.log gate-keeper server
```

### Monorepo: workspace-specific scripts

Because Gate Keeper reads from `process.cwd()`, running from different workspace directories picks up different config files:

```bash
cd packages/api   && gate-keeper server  # uses packages/api/gate-keeper.conf.json
cd packages/ui    && gate-keeper server  # uses packages/ui/gate-keeper.conf.json
```

---

## Validation Rules

Gate Keeper enforces these rules at startup and exits with a descriptive error if any are violated:

1. Config file must be parseable as JSON.
2. `scripts` must be a non-empty array.
3. Each script must have a non-empty `name` string.
4. Each script must have a non-empty `command` string.
5. `port` must be a positive integer if provided.

---

## Configuration Model (internal)

The authoritative TypeScript-style shape defined in `src/models/configuration.model.mjs`:

```js
GATE_KEEPER_CONFIG_MODEL = {
  port: Number,
  host: String,
  scripts: [SCRIPT_MODEL]
}

SCRIPT_MODEL = {
  name: String,
  command: String,
  data: String | null,
  result: Boolean | null
}
```

See [Data Models](Data-Models.md) for the full model reference.
