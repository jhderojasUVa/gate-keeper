# Web UI

The Gate Keeper web dashboard is a vanilla JavaScript single-page application served directly by the Express server.

---

## Access

Navigate to `https://localhost:9000` while the server is running. Accept the self-signed certificate warning in your browser.

---

## Technology Stack

| Concern | Choice |
|---------|--------|
| JavaScript | Vanilla ES2020+ (no framework) |
| CSS | Pure CSS with custom properties |
| HTML | Semantic HTML5 |
| HTTP | Fetch API |
| WebSocket | Native browser `WebSocket` API |
| Build | None — files served as-is |

No bundler, no transpilation, no Node.js devDependencies on the frontend. The `public/` directory is static and self-contained.

---

## File Structure

```
public/
├── index.html          Entry point
├── css/
│   └── styles.css      All styles
└── js/
    └── main.mjs        All application logic
```

---

## `public/index.html`

### Layout Sections

| Section | Element ID | Purpose |
|---------|-----------|---------|
| Header | `header` | App title + WS connection badge |
| Status Card | `#commit-status-card` | Large green/red commit decision indicator |
| System Feed | `#system-feed` | Scrollable live log of script execution events |

---

## `public/js/main.mjs`

### Initialisation Flow

```
DOMContentLoaded
      │
      ▼
getWsPort()     ← GET /ws-port
      │
      ▼
connectToWs(port)
      │
      ├─ ws.onopen     → update WS badge to "Connected"
      ├─ ws.onmessage  → parse message, update UI
      ├─ ws.onerror    → update WS badge to error state
      └─ ws.onclose    → update WS badge, schedule reconnect in 5s
```

### Key Functions

#### `getWsPort()`

```js
async function getWsPort(): Promise<number>
```

Fetches `GET /ws-port` from the Express server. Returns the WebSocket port number. Called once on page load.

#### `connectToWs(port)`

```js
function connectToWs(port: number): void
```

Creates a `WebSocket` connection to `ws://localhost:<port>`. Registers all event handlers. On close/error, calls `setTimeout(connectToWs, 5000)` for automatic reconnection.

#### `updateCommitStatus(canCommit, inProgress)`

```js
function updateCommitStatus(canCommit: boolean, inProgress: boolean): void
```

Updates the status card:

| State | Card appearance | Text |
|-------|----------------|------|
| `inProgress: true` | Yellow / neutral | "Checking..." |
| `canCommit: true` | Green | "Ready to Commit" |
| `canCommit: false` | Red | "Commit Blocked" |

CSS classes toggled on the card: `.status-ok`, `.status-error`, `.status-checking`.

#### `createLogElement(message, timestamp)`

```js
function createLogElement(message: string, timestamp?: Date): HTMLElement
```

Builds a `<div class="log-entry">` containing:
- A `<span class="timestamp">` with locale time including milliseconds.
- A `<span class="message">` with the log text.

New entries are **prepended** to `#system-feed` (newest at top).

#### `formatTime(date)`

```js
function formatTime(date: Date): string
```

Returns a locale-formatted time string including milliseconds. Uses `date.toLocaleTimeString()` combined with manual milliseconds extraction.

---

## `public/css/styles.css`

### Design System

CSS custom properties define the colour palette:

```css
:root {
  --color-bg: #0f0f13;
  --color-surface: #1a1a24;
  --color-border: #2a2a3e;
  --color-text: #e2e2f0;
  --color-text-muted: #6b6b8a;
  --color-success: #22c55e;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  --color-accent: #7c3aed;
}
```

### Visual Effects

| Effect | Implementation |
|--------|---------------|
| Animated blobs | CSS `@keyframes` on absolutely-positioned pseudo-elements |
| Glassmorphism cards | `backdrop-filter: blur()` + semi-transparent backgrounds |
| Status transitions | CSS `transition` on background-color and color |
| Responsive layout | CSS Grid with `minmax()` columns |

### Status Colour Classes

| Class | Color | Meaning |
|-------|-------|---------|
| `.status-ok` | `--color-success` (green) | All scripts passed |
| `.status-error` | `--color-error` (red) | One or more scripts failed |
| `.status-checking` | `--color-warning` (amber) | Scripts running |

---

## WebSocket Message Handling

The web client handles `STATUS_UPDATE` messages:

```js
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === 'STATUS_UPDATE') {
    updateCommitStatus(msg.canCommit, msg.inProgress);

    for (const script of msg.scripts) {
      const icon = script.result === true ? '✓' : '✗';
      createLogElement(`${icon} ${script.name}: ${script.data}`);
    }
  }
};
```

All other message types are logged to the feed as raw text.

---

## Triggering a Re-check from the UI

The dashboard does not currently expose a manual re-check button. To trigger a re-check, a developer can use the browser DevTools console:

```js
// Assuming ws is the open WebSocket (accessible if you add it to window)
ws.send(JSON.stringify({ type: 'RE_CHECK' }));
```

Contributing a re-check button to the UI is a good first contribution. See [Contributing](Contributing.md).

---

## Extending the Web UI

Because there is no build step, extending the UI is straightforward:

1. Edit `public/index.html` to add markup.
2. Edit `public/css/styles.css` to add styles.
3. Edit `public/js/main.mjs` to add logic.
4. Test with `gate-keeper server --open`.

Follow the existing vanilla-JS patterns — do not introduce framework dependencies without discussion. See [Contributing](Contributing.md).
