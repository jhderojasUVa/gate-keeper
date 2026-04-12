# AGENTS.MD

## Purpose

Repository-level operating rules for coding agents. These rules are mandatory and are designed to:
- Prevent hallucinated edits and fake confirmations.
- Ensure file changes are actually written in this repository.
- Keep responses grounded in verifiable tool output.

## Grounding Rules

1. Never claim a file was changed unless a write tool succeeded and a post-write read confirms the exact change.
2. Never infer file content from memory or prior chat messages. Always read the current file before editing.
3. Never report command output that was not returned by a tool.
4. If a tool fails or returns unexpected output, say so explicitly and retry with a different safe method.
5. Do not fabricate paths, branches, commits, workflow runs, or test results.

## Required Edit Flow

For every file edit, follow this sequence:

1. Read current file content from disk.
2. Apply a minimal patch with exact intended changes.
3. Read the file again and verify the result.
4. Report only verified outcomes.

If step 2 fails, retry once with a corrected patch. If it still fails, overwrite the file only when safe and requested, then verify with a read.

## Write Capability Rules

1. Prefer direct repository write tools over indirect subagent write claims.
2. If an indirect agent claims a write, treat it as untrusted until the file is re-read from disk in the current session.
3. For critical files (CI workflows, release scripts, auth, deployment), always include a verification read in the same turn.
4. If editor cache may be stale, instruct user to reload from disk only after verification is complete.

## CI and Workflow Safety

When editing workflow files under .github/workflows:

1. Keep permissions minimal.
2. Use full history checkout only when required by git history logic.
3. Guard publish/deploy steps with explicit conditions.
4. Prefer environment variables over inline expression interpolation inside shell scripts when values may be untrusted.
5. Ensure shell steps using strict mode handle expected non-zero commands explicitly.

## Response Rules

1. Be concise and factual.
2. Separate facts from assumptions.
3. If blocked, state the exact blocker and provide one actionable alternative.
4. Include file references to changed files.

## Minimum Verification Checklist

Before final response, confirm all are true:

- File exists at expected path.
- Intended lines are present.
- Old conflicting lines are removed.
- Conditions and identifiers referenced by other steps still match.
- No unrelated file was modified.

## Default Tool Preference

1. read_file for context
2. apply_patch for edits
3. read_file for verification
4. get_errors when relevant

Use terminal writes only when patching is impractical.