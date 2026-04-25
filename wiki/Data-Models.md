# Data Models

This page documents every data structure defined in `src/models/`. These are the canonical shapes shared across the server, libraries, and tests.

---

## Overview

| Model File | What it defines |
|-----------|----------------|
| `configuration.model.mjs` | Config file schema and script shape |
| `scriptResult.model.mjs` | Return value from `child_process.exec` wrapper |
| `wsResponse.model.mjs` | WebSocket response status templates |
| `wsServerRequest.model.mjs` | Enum of WebSocket message types |

---

## Configuration Model (`configuration.model.mjs`)

### `SCRIPT_MODEL`

Runtime representation of one configured script.

```js
{
  name:    String,          // display name (from config file)
  command: String,          // shell command to execute (from config file)
  data:    String | null,   // stdout + stderr captured after execution
  result:  Boolean | null   // true = exit 0, false = non-zero exit, null = not yet run
}
```

`data` and `result` are `null` until the script has been executed. They are overwritten on every execution cycle.

### `GATE_KEEPER_CONFIG_MODEL`

Shape of a loaded, validated configuration.

```js
{
  port:    Number,      // Express server port
  host:    String,      // Express bind hostname
  scripts: [SCRIPT_MODEL]  // ordered array of scripts to run
}
```

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `CONFIGURATION_FILE` | `"gate-keeper.conf.json"` | Expected filename in project root |
| `DEFAULT_CONFIGURATION_FILE` | `"default.gate-keeper.conf.json"` | Bundled fallback config filename |

---

## Script Result Model (`scriptResult.model.mjs`)

Return value from the `child_process.exec` promise wrapper in `execute_scripts.mjs`.

```js
{
  success: Boolean,  // true if exit code was 0
  data:    any       // stdout string on success, stderr or Error on failure
}
```

This is an **internal** model — it is not transmitted over the wire directly. The `data` and `success` fields are mapped onto the `SCRIPT_MODEL` shape after execution.

---

## WebSocket Response Model (`wsResponse.model.mjs`)

Predefined WebSocket response payload templates for common status responses.

### `WS_RESPONSE_OK`

```js
{
  type:      "STATUS_UPDATE",
  canCommit: true,
  scripts:   []
}
```

Used as a base template when all scripts have passed. The `scripts` array is populated before transmission.

### `WS_RESPONSE_KO`

```js
{
  type:      "STATUS_UPDATE",
  canCommit: false,
  scripts:   []
}
```

Used as a base template when one or more scripts have failed.

> **Note:** These templates are starting points. The actual broadcast messages produced by `server_ws.mjs` merge the current `state.getStatus()` into these shapes.

---

## WebSocket Server Request Model (`wsServerRequest.model.mjs`)

### `TYPES_MESSAGES`

Enum-like object mapping all known message type strings:

```js
const TYPES_MESSAGES = {
  RE_CHECK:      "RE_CHECK",
  FIRST_RUN:     "FIRST_RUN",
  STILL_WORKING: "STILL_WORKING",
  ERROR:         "ERROR",
  EXIT:          "EXIT",
  UNKNOW:        "UNKNOW",       // note: intentional spelling in source
  FATAL_ERROR:   "FATAL_ERROR",
  STATUS_UPDATE: "STATUS_UPDATE"
}
```

**Direction reference:**

| Type | Direction | Meaning |
|------|-----------|---------|
| `RE_CHECK` | Client → Server | Trigger script re-run |
| `FIRST_RUN` | Client → Server | Initial connection, trigger run |
| `STILL_WORKING` | Server → Client | Scripts still executing |
| `STATUS_UPDATE` | Server → Client | Full state broadcast |
| `ERROR` | Server → Client | Non-fatal server error |
| `EXIT` | Client → Server | Client requests disconnect |
| `FATAL_ERROR` | Client → Server | Client unrecoverable error |
| `UNKNOW` | — | Fallback for unrecognized types |

---

## State Shape (runtime, not a model file)

The in-memory state held by `src/libs/state.mjs` is not defined as a separate model file, but its shape is:

```js
{
  canCommit:  Boolean,     // aggregate gate decision
  inProgress: Boolean,     // true while executeAllScripts() is running
  scripts:    SCRIPT_MODEL[]  // per-script current results
}
```

---

## Type Conventions

| Convention | Meaning |
|------------|---------|
| `null` on `result` | Script has not been run yet in this session |
| `true` on `result` | Script exited with code 0 |
| `false` on `result` | Script exited with non-zero code or threw |
| `inProgress: true` | Execution cycle actively running (do not read `canCommit` as final) |
| `canCommit: false` | At least one `script.result === false` |
