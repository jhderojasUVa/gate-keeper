# Getting Started

This guide walks you through installing Gate Keeper, running it for the first time, and wiring it into a Git pre-commit hook.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20 or later |
| npm | 9 or later |
| Git | any modern version |
| OS | Linux, macOS, Windows (WSL recommended) |

---

## Installation

### From GitHub Packages (npm registry)

Gate Keeper is published to GitHub Packages. Add the registry scope to your `.npmrc` first:

```
@fvena:registry=https://npm.pkg.github.com
```

Then install globally:

```bash
npm install -g @fvena/gate-keeper
```

Or as a dev dependency in your project:

```bash
npm install --save-dev @fvena/gate-keeper
```

### From Source

```bash
git clone https://github.com/fvena/gate-keeper.git
cd gate-keeper
npm install
npm link   # makes gate-keeper available globally
```

---

## First Run

### 1. Generate a configuration file

From the root of your project:

```bash
gate-keeper-init
```

This creates `gate-keeper.conf.json` in the current directory with a minimal example configuration. See [Configuration](Configuration.md) for the full schema.

### 2. Start the server

```bash
gate-keeper server
```

The service starts, runs all configured scripts once, and listens on:
- `https://localhost:9000` — web dashboard + REST API
- `wss://localhost:9001` — WebSocket feed
- `http://localhost:9002` — MCP endpoint

To start and automatically open the web dashboard:

```bash
gate-keeper server --open
```

### 3. Open the dashboard

If you did not use `--open`, navigate to:

```
https://localhost:9000
```

Your browser will warn about the self-signed certificate. Accept the exception to proceed. This is expected for local development — see [Architecture § HTTPS Strategy](Architecture.md#https-strategy).

### 4. Verify the service

```bash
curl -k https://localhost:9000/cancommit
```

Expected response:

```json
{ "cancommit": true }
```

---

## Wiring the Pre-commit Hook

Gate Keeper acts as a passive daemon. The Git hook polls its REST API.

### Using Husky

If your project already uses Husky:

```bash
npx husky add .husky/pre-commit "curl -sf -k https://localhost:9000/cancommit | grep -q '\"cancommit\":true' || (echo 'Gate Keeper: commit blocked' && exit 1)"
```

### Manual `.git/hooks/pre-commit`

```bash
#!/bin/sh
RESULT=$(curl -sf -k https://localhost:9000/cancommit 2>/dev/null)
if [ $? -ne 0 ]; then
  echo "Gate Keeper is not running. Start it with: gate-keeper server"
  exit 1
fi
echo "$RESULT" | grep -q '"cancommit":true' || {
  echo "Gate Keeper: commit blocked by failing scripts."
  exit 1
}
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

### Checking status without blocking

```bash
gate-keeper client          # opens web UI in browser
gate-keeper client-terminal # TUI in terminal
```

---

## Customising Your Scripts

Edit `gate-keeper.conf.json` to define the scripts Gate Keeper will run:

```json
{
  "port": 9000,
  "host": "localhost",
  "scripts": [
    {
      "name": "Type check",
      "command": "npx tsc --noEmit"
    },
    {
      "name": "Tests",
      "command": "npm test"
    },
    {
      "name": "Lint",
      "command": "npm run lint"
    }
  ]
}
```

After saving, send a `RE_CHECK` WebSocket message or restart the server to re-run the scripts. See [WebSocket Protocol](WebSocket-Protocol.md) for triggering a re-run programmatically.

---

## WSL Users

Gate Keeper detects WSL environments and converts Linux paths to Windows paths automatically when opening the browser. The `wsl.bat` file at the repository root is the Windows launcher shim invoked in these scenarios.

No additional configuration is required.

---

## Docker

Gate Keeper can run in a container. Expose the required ports:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 9000 9001 9002
CMD ["node", "src/index.js", "server"]
```

Environment variables for Docker:

```bash
docker run -p 9000:9000 -p 9001:9001 -p 9002:9002 \
  -e GATE_KEEPER_HTTPS=false \
  gate-keeper
```

See [Configuration § Environment Variables](Configuration.md#environment-variables) for all options.
