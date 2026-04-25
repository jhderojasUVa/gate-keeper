# Contributing

This guide describes the full development workflow for contributing to Gate Keeper, from forking the repository to getting your changes merged.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20 or later |
| npm | 9 or later |
| Git | any modern version |

---

## Setup

### 1. Fork and clone

```bash
git clone https://github.com/YOUR_USERNAME/gate-keeper.git
cd gate-keeper
npm install
```

`npm install` automatically runs `husky` to install Git hooks (via the `prepare` script). These hooks enforce commit message format before every commit.

### 2. Verify your setup

```bash
npm run lint     # should pass with no errors
npm test         # should pass with coverage above thresholds
```

---

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<short-description>` | `feature/re-check-button` |
| Bug fix | `fix/<short-description>` | `fix/ws-reconnect-loop` |
| Documentation | `docs/<short-description>` | `docs/mcp-integration` |
| Refactor | `refactor/<short-description>` | `refactor/state-api` |
| Chore | `chore/<short-description>` | `chore/update-deps` |

Always branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

---

## Development Workflow

```bash
# Start the dev server
gate-keeper server --open

# In a separate terminal, watch tests
npx vitest --watch

# Lint as you go
npm run lint:fix
```

---

## Commit Conventions

Gate Keeper uses [Conventional Commits](https://www.conventionalcommits.org/). This is enforced by Commitizen (`npm run cz`) and validated by the Husky pre-commit hook.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use |
|------|------------|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change that is neither fix nor feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `chore` | Build system, dependencies, configuration |

### Breaking Changes

Append `!` after the type, or add `BREAKING CHANGE:` in the footer:

```
feat!: change cancommit response shape

BREAKING CHANGE: the field is now camelCase `canCommit` instead of `cancommit`
```

### Using Commitizen

```bash
npm run cz
```

This launches an interactive wizard that helps you build a valid commit message.

---

## Quality Checklist

Run all of these before opening a PR:

```bash
npm run lint     # no ESLint errors
npm test         # all tests pass + coverage above thresholds
```

Your PR will be blocked by CI until both pass.

---

## Opening a Pull Request

1. Push your branch to your fork.
2. Open a PR against `main` on the upstream repository.
3. Fill in the PR description: what changed, why, and how to test it.
4. CI runs `pr-check.yml` automatically (lint + tests).
5. A reviewer will be assigned.

---

## Release Process

Releases are automated via `publish.yml`. When a PR is merged to `main`, the workflow:

1. Analyses commit messages since the last tag.
2. Determines the version bump: `major`, `minor`, or `patch`.
3. Runs `npm run release:<type>` (which runs `standard-version`).
4. Publishes to GitHub Packages.
5. Pushes the new tag and updated `CHANGELOG.md`.

Maintainers can also manually trigger specific bump types:

```bash
npm run release:patch  # 1.2.0 → 1.2.1
npm run release:minor  # 1.2.0 → 1.3.0
npm run release:major  # 1.2.0 → 2.0.0
```

**Never manually edit `package.json` version** — let the release scripts manage it.

---

## Code Style

- **ES Modules** throughout. Always use `.mjs` for new non-binary files.
- **No semicolons** (enforced by ESLint).
- **Single quotes** for strings.
- **2-space indentation**.
- **No `var`** — use `const` or `let`.
- Prefer `async/await` over `.then()` chains.
- Export named exports from library modules. Avoid default exports except for model objects.

---

## Adding a New Script

If you are extending Gate Keeper's script execution (for example, adding concurrency limits or timeouts):

1. Edit `src/libs/execute_scripts.mjs`.
2. Update tests in `test/libs/execute_scripts.test.mjs`.
3. Update [Libraries](Libraries.md) wiki page.

## Adding a New REST Endpoint

1. Edit `src/server/server_conf.mjs`.
2. Add a corresponding test in `test/server/server_conf.test.mjs`.
3. Update [Server Components](Server-Components.md) wiki page.

## Adding a New WebSocket Message Type

1. Add the type to `TYPES_MESSAGES` in `src/models/wsServerRequest.model.mjs`.
2. Handle it in `src/server/server_ws.mjs`.
3. Update tests.
4. Update [WebSocket Protocol](WebSocket-Protocol.md) wiki page.

## Adding a New MCP Tool

See [MCP Integration § Extending the MCP Server](MCP-Integration.md#extending-the-mcp-server).

---

## Reporting Bugs

Open a GitHub Issue with:
- Gate Keeper version (`gate-keeper --version`).
- Node.js version (`node --version`).
- OS and shell.
- Minimal reproduction steps.
- Expected vs actual behaviour.
- Relevant logs (redact any secrets from script output).
