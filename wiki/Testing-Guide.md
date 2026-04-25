# Testing Guide

Gate Keeper uses [Vitest](https://vitest.dev/) for its test suite. This page covers the test setup, patterns used throughout the codebase, coverage requirements, and how to write new tests.

---

## Running Tests

```bash
npm test              # Run all tests with coverage report
npm run test:unit     # Run all tests without coverage
```

Tests run in the Node.js environment (not jsdom). All `describe`, `it`, and `expect` globals are available without imports (`globals: true` in Vitest config).

---

## Vitest Configuration

`vitest.config.mjs`:

```js
{
  test: {
    environment: 'node',
    globals: true
  },
  coverage: {
    provider: 'v8',
    all: false,
    include: ['src/**'],
    exclude: ['public/**', 'src/index.js', 'src/init.mjs'],
    thresholds: {
      lines:      80,
      functions:  80,
      branches:   70,
      statements: 80
    }
  }
}
```

**Coverage is collected only from `src/`**, excluding:
- `public/` — frontend code (no server-side coverage)
- `src/index.js` — thin shim with no testable logic
- `src/init.mjs` — CLI init command (integration concern)

---

## Test Directory Structure

```
test/
├── example.test.js                   # Sanity check / template
├── index.test.mjs                    # src/index.js dispatch tests
├── init.test.mjs                     # gate-keeper-init tests
├── libs/
│   ├── app_utils.test.mjs
│   ├── colors.test.mjs
│   ├── execute_scripts.test.mjs
│   ├── load_config.test.mjs
│   ├── log.test.mjs
│   ├── scripts_check.test.mjs
│   └── state.test.mjs
├── models/
│   ├── configuration.model.test.mjs
│   ├── scriptResult.model.test.mjs
│   ├── wsResponse.model.test.mjs
│   └── wsServerRequest.model.test.mjs
├── server/
│   ├── index.test.mjs
│   ├── mcp_server.test.mjs
│   ├── response.interface.test.mjs
│   ├── server_conf.test.mjs
│   └── server_ws.test.mjs
├── terminal/
│   └── client-terminal.test.mjs
├── public/
│   └── main.test.mjs
└── workflows/
    └── publish-detection.test.mjs
```

Each source file has a corresponding test file in the same relative path under `test/`.

---

## AAA Pattern

All tests in the project follow the **Arrange–Act–Assert** pattern:

```js
it('should return false when any script fails', () => {
  // Arrange
  const scripts = [
    { name: 'lint', result: true },
    { name: 'tests', result: false }
  ];

  // Act
  const result = canCommit(scripts);

  // Assert
  expect(result).toBe(false);
});
```

---

## State Isolation

The `STATE` singleton must be reset between tests to prevent state leakage:

```js
import { STATE } from '../../src/libs/state.mjs';

describe('My feature', () => {
  beforeEach(() => {
    STATE.clearAll();
    STATE.canCommit = false;
    STATE.inProgress = false;
  });

  it('...', () => { ... });
});
```

Always reset state in `beforeEach`, not `afterEach`. This ensures a clean state even if a previous test throws.

---

## Mocking

Vitest provides `vi.mock()` and `vi.spyOn()` for mocking modules and functions.

### Mocking `child_process`

```js
import { vi } from 'vitest';

vi.mock('child_process', () => ({
  exec: vi.fn((command, callback) => {
    callback(null, 'stdout output', '');
  })
}));
```

### Mocking WebSocket

```js
vi.mock('ws', () => {
  const MockWS = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1  // OPEN
  }));
  MockWS.Server = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    clients: new Set()
  }));
  return { default: MockWS, WebSocket: MockWS };
});
```

### Mocking the file system

```js
import { vi } from 'vitest';
import * as fs from 'fs';

vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
  port: 9000,
  host: 'localhost',
  scripts: [{ name: 'test', command: 'echo ok' }]
}));
```

---

## Testing Server Endpoints

Use Vitest with `supertest` for Express endpoint tests:

```js
import request from 'supertest';
import { express_app } from '../../src/server/server_conf.mjs';

it('GET /cancommit returns 200', async () => {
  const res = await request(express_app).get('/cancommit');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('cancommit');
});
```

---

## Testing WebSocket Behaviour

WebSocket server tests use a real WebSocket client connecting to a test server started on an ephemeral port:

```js
import WebSocket from 'ws';

let server, port;

beforeAll(async () => {
  // start server on random port
  port = await startTestWsServer();
});

afterAll(() => server.close());

it('sends STATUS_UPDATE on connection', (done) => {
  const ws = new WebSocket(`ws://localhost:${port}`);
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'STATUS_UPDATE') {
      expect(msg).toHaveProperty('canCommit');
      ws.close();
      done();
    }
  });
});
```

---

## Workflow Tests

`test/workflows/publish-detection.test.mjs` validates the CI release type detection logic by importing the detection function directly. This guards against regressions in the publish workflow's commit-message-parsing logic without requiring a full GitHub Actions run.

---

## Coverage Thresholds

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Functions | 80% |
| Branches | 70% |
| Statements | 80% |

The CI pipeline (`pr-check.yml`) enforces these thresholds. A PR that drops coverage below any threshold will fail CI.

To view the coverage report locally:

```bash
npm test
open coverage/index.html
```

---

## Adding Tests for New Code

1. Create `test/<matching/path/to/source>.test.mjs`.
2. Import the module under test using a relative path.
3. Write `describe` blocks mirroring the source module's exported functions.
4. Use `beforeEach` to reset any shared state.
5. Follow the AAA pattern.
6. Run `npm test` to verify coverage thresholds are still met.

If your new code branches on environment variables, test both paths by overriding `process.env` in `beforeEach` and restoring it in `afterEach`:

```js
const originalEnv = { ...process.env };

afterEach(() => {
  process.env = originalEnv;
});
```
