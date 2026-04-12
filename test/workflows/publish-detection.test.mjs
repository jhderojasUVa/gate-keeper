import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Test Suite: Release Type Detection Logic from .github/workflows/publish.yml
 * 
 * Validates the Conventional Commits detection logic that determines:
 * - major (BREAKING CHANGE or !)
 * - minor (feat)
 * - patch (fix|perf|refactor|revert)
 * - none (all others, including filtered chore(release):)
 */

// Simulate the bash detection logic from the workflow
function detectReleaseType(logContent, includeChoreRelease = false) {
  // Filter out chore(release): commits to avoid release loops
  let filtered = logContent;
  if (!includeChoreRelease) {
    filtered = logContent
      .split('\n')
      .filter(line => !line.match(/^chore\(release\):/))
      .join('\n');
  }

  let type = 'none';

  // Priority 1: BREAKING CHANGE or ! suffix
  if (
    filtered.match(/^[a-z]+(\([^)]*\))?!/m) ||
    filtered.match(/(^|\s)BREAKING CHANGE:/i)
  ) {
    type = 'major';
  }
  // Priority 2: feat commits
  else if (filtered.match(/^feat(\([^)]*\))?:/m)) {
    type = 'minor';
  }
  // Priority 3: patch-type commits
  else if (filtered.match(/^(fix|perf|refactor|revert)(\([^)]*\))?:/m)) {
    type = 'patch';
  }

  return type;
}

describe('Release Type Detection Logic (.github/workflows/publish.yml)', () => {
  it('Test 1: BREAKING CHANGE footer → expect major', () => {
    const log = `fix: critical bug

BREAKING CHANGE: removed deprecated API method`;
    expect(detectReleaseType(log)).toBe('major');
  });

  it('Test 2: feat(scope): add feature → expect minor', () => {
    const log = `feat(auth): add OAuth provider support`;
    expect(detectReleaseType(log)).toBe('minor');
  });

  it('Test 3: fix: bug → expect patch', () => {
    const log = `fix: memory leak in connection handler`;
    expect(detectReleaseType(log)).toBe('patch');
  });

  it('Test 4: docs: update → expect none (not in patch set)', () => {
    const log = `docs: update README installation section`;
    expect(detectReleaseType(log)).toBe('none');
  });

  it('Test 5: feat + fix mixed → expect minor (highest precedence in detection order)', () => {
    const log = `feat: new dashboard component
fix: typo in error message`;
    expect(detectReleaseType(log)).toBe('minor');
  });

  it('Test 6: BREAKING CHANGE + feat + fix → expect major (highest precedence)', () => {
    const log = `feat: remove deprecated endpoint

BREAKING CHANGE: API endpoint restructured
fix: handle null values`;
    expect(detectReleaseType(log)).toBe('major');
  });

  it('Test 7: chore(release): v1.2.3 only → expect none (filtered out)', () => {
    const log = `chore(release): v1.2.3`;
    // Simulating the workflow's filtering behavior
    expect(detectReleaseType(log, false)).toBe('none');
  });

  it('Test 8: type(scope)!: breaking → expect major (! form)', () => {
    const log = `feat(api)!: restructure response format`;
    expect(detectReleaseType(log)).toBe('major');
  });

  it('Test 8b: fix!: breaking in ! form → expect major', () => {
    const log = `fix!: remove legacy query parameter`;
    expect(detectReleaseType(log)).toBe('major');
  });

  it('Test 8c: chore!: breaking chore → expect major', () => {
    const log = `chore!: drop Node 14 support`;
    expect(detectReleaseType(log)).toBe('major');
  });

  // Edge cases
  it('Edge Case: perf commit → expect patch', () => {
    const log = `perf: optimize database query`;
    expect(detectReleaseType(log)).toBe('patch');
  });

  it('Edge Case: refactor commit → expect patch', () => {
    const log = `refactor: extract utility functions`;
    expect(detectReleaseType(log)).toBe('patch');
  });

  it('Edge Case: revert commit → expect patch', () => {
    const log = `revert: undo feature flag changes`;
    expect(detectReleaseType(log)).toBe('patch');
  });

  it('Edge Case: Multiple chore(release) filtered, has feat → expect minor', () => {
    const log = `chore(release): v1.0.0
feat: new feature
chore(release): bump version`;
    expect(detectReleaseType(log, false)).toBe('minor');
  });

  it('Edge Case: BREAKING CHANGE with leading whitespace', () => {
    const log = `fix: update handler

Some description text
BREAKING CHANGE: API changed`;
    expect(detectReleaseType(log)).toBe('major');
  });

  it('Edge Case: Case-insensitive BREAKING CHANGE detection', () => {
    const log = `fix: update handler

breaking change: API changed`;
    expect(detectReleaseType(log)).toBe('major');
  });

  it('Edge Case: Only style/build commits → expect none', () => {
    const log = `style: format code
build: update dependencies`;
    expect(detectReleaseType(log)).toBe('none');
  });
});
