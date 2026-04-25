# CI/CD

Gate Keeper uses GitHub Actions for continuous integration and automated releases. Two workflows are defined under `.github/workflows/`.

---

## Workflows Overview

| File | Name | Trigger | Purpose |
|------|------|---------|---------|
| `pr-check.yml` | PR Check | PR opened/updated targeting `main` | Validate code quality |
| `publish.yml` | Release | Push to `main` | Bump version, publish npm package |

---

## `pr-check.yml` — Pull Request Validation

### Trigger

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main]
```

Every time a PR is opened against `main` or updated (new commits pushed), this workflow runs.

### Steps

| Step | Command | Description |
|------|---------|-------------|
| Checkout | `actions/checkout@v4` | Check out PR head |
| Setup Node | `actions/setup-node@v4` (v20) | Install Node.js 20 |
| Install deps | `npm ci` | Clean install from lockfile |
| Lint | `npm run lint` | ESLint — fails on any violation |
| Test | `npm run test` | Vitest — fails below coverage thresholds |

### Failure Behaviour

A failing lint or test step marks the PR check as failed. GitHub's branch protection rules should be set to require this check to pass before merging.

---

## `publish.yml` — Release and Publish

### Trigger

```yaml
on:
  push:
    branches: [main]
```

Runs on every push to `main`. Protected against infinite loops:
```yaml
if: github.actor != 'github-actions[bot]'
```

The bot actor check prevents the workflow from re-triggering itself after it pushes the release commit.

### Permissions

```yaml
permissions:
  contents: write   # push tags and commits
  packages: write   # publish to GitHub Packages
```

### Concurrency

```yaml
concurrency:
  group: release-${{ github.ref_name }}
  cancel-in-progress: false
```

Only one release runs at a time per branch. New triggers do **not** cancel an in-progress release — they wait.

### Steps in Detail

#### 1. Checkout full history

```yaml
uses: actions/checkout@v5
with:
  fetch-depth: 0
  fetch-tags: true
```

Full history (`fetch-depth: 0`) and all tags are required for `git describe` to find the previous version tag and for `git log` to analyse commits since that tag.

#### 2. Setup Node 22

```yaml
uses: actions/setup-node@v5
with:
  node-version: 22
  cache: npm
  registry-url: https://npm.pkg.github.com
```

Node 22 for publishing. The `registry-url` configures npm to point at GitHub Packages.

#### 3. Install and test

```bash
npm ci
npm test
```

Tests must pass before any release attempt.

#### 4. Detect release type

This is the most complex step. It analyses Git commit messages since the last `v*.*.*` tag:

```bash
LAST_TAG="$(git describe --tags --abbrev=0 --match 'v[0-9]*.[0-9]*.[0-9]*')"
RANGE="${LAST_TAG:+${LAST_TAG}..}HEAD"
LOG="$(git log --format='%s%n%b%n<<<END>>>' "${RANGE}")"
```

Commits matching `chore(release):` are filtered out to avoid infinite loop detection failures.

**Detection priority:**

| Pattern | Outcome | Example |
|---------|---------|---------|
| `BREAKING CHANGE:` in body | `major` | Any commit with breaking change footer |
| `type!:` subject | `major` | `feat!: rename API` |
| `feat:` subject | `minor` | `feat: add re-check button` |
| `fix:`, `perf:`, `refactor:`, `revert:` | `patch` | `fix: ws reconnect loop` |
| None of the above | `none` | `docs:`, `chore:`, `style:`, `test:` |

The detected type is set as a step output: `steps.detect.outputs.release_type`.

#### 5. Run standard-version

```bash
npm run release:${TYPE}
```

Where `TYPE` is `major`, `minor`, or `patch`. This:
- Bumps `version` in `package.json`.
- Updates `CHANGELOG.md` from commit messages.
- Creates a Git commit: `chore(release): v1.3.0`.
- Creates a Git tag: `v1.3.0`.

This step is **skipped** if `release_type == 'none'`.

#### 6. Publish and push

```bash
npm publish
git push origin main --follow-tags
```

`npm publish` uploads to `npm.pkg.github.com` (GitHub Packages) using `${{ github.token }}`. The push sends the release commit and new version tag back to `main`.

This step is guarded by a repository check — it only publishes from the upstream repository, not from forks:

```bash
if [ "${GITHUB_REPOSITORY}" = "jhderojasUVa/gate-keeper" ]; then
  npm publish
fi
```

---

## Release Loop Prevention

Multiple layers prevent the release workflow from triggering itself:

1. `if: github.actor != 'github-actions[bot]'` — workflow-level guard.
2. Filtering `chore(release):` commits from the log analysis in the detect step.
3. A sanity check step verifies the last commit is not already a `chore(release):` commit.

---

## Branch Protection Setup (Recommended)

To enforce quality gates, configure the `main` branch with the following protection rules:

1. **Require status checks to pass before merging** — include `Check Code and Documentation` (from `pr-check.yml`).
2. **Require branches to be up to date before merging**.
3. **Restrict pushes to `main`** — only allow merges via PR.

---

## Secrets and Tokens

| Secret | Source | Used for |
|--------|--------|---------|
| `github.token` | Automatic | npm publish + git push |

No additional secrets are required. The automatic `GITHUB_TOKEN` has sufficient permissions given the `contents: write` and `packages: write` grants.

---

## Adding a New Workflow

1. Create `.github/workflows/<name>.yml`.
2. Keep permissions minimal — only what the job absolutely needs.
3. Use `actions/checkout@v5` and `actions/setup-node@v5` (latest stable versions).
4. Use `npm ci` (not `npm install`) in CI to ensure reproducible installs.
5. Store secrets in GitHub repository settings, not as hardcoded values.
6. Add a column to the Workflows Overview table above and document new steps.
