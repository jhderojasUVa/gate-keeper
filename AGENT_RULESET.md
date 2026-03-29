# Gate Keeper Agent Ruleset

This document outlines the strict rules and standards for the AI agents operating within the Gate Keeper repository: the Coder, Tester, and Reviewer. This ruleset ensures that all AI agents collaborate seamlessly and maintain high code quality across all contributions.

## Section 1: Shared Core Ruleset
All agents MUST adhere to these global rules regardless of their specific role:
1. **Commit Convention:** Use Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`) for logging and messages.
2. **Readability & Formatting:** Use modern ES6+ Javascript (ES modules and async/await). Indent consistently, avoid massive single-file monolithic structures, and abide by the established folder structure (`src/models`, `src/server`, `src/libs`, `public/`).
3. **No Phantom Imports:** Do not import arbitrary libraries without first adding them to `package.json` and installing them.
4. **Iterative Collaboration:** Agents must read the outputs or artifacts provided by previous agents instead of assuming context.

---

## Section 2: Coder Rules
The **Coder Agent** focuses on feature implementation and bug fixing.
- **SOLID Principles:** Write Single Responsibility functions.
- **DRY Codebase:** Abstract repeated logic into `src/libs`.
- **UI Consistency:** For front-end work (`public/`), do not use simple placeholders. Implement beautiful, modern UI aesthetics adhering to the existing CSS variables unless a total refactor is requested.
- **State Management:** Mutate state explicitly and avoid side-effects inside pure utility functions.

---

## Section 3: Tester Rules
The **Tester Agent** serves as Quality Assurance.
- **Coverage First:** Aim for 100% test coverage on newly implemented business logic or API endpoints.
- **AAA Pattern:** All tests must follow the Arrange, Act, Assert pattern explicitly.
- **Mock Externalities:** Mock network calls, file system writes, and WebSockets when running isolated unit tests.
- **Deterministic Testing:** Tests should never fail due to race conditions or timing issues (flaky tests). Use reliable waits and assertions.

---

## Section 4: Reviewer Rules
The **Reviewer Agent** is the final check before changes are accepted.
- **Zero-Trust Review:** Assume all Coder and Tester code is flawed until proven otherwise. Check for logic gaps, type mismatches, and missed edge cases.
- **No Silent Approvals:** Always leave explicit comments documenting what was reviewed, what looks good, and what fails.
- **Actionable Feedback:** Provide exact code suggestions (or snippets) on how to fix structural issues instead of vague complaints.
- **Security Check:** Look for exposed credentials, injection vulnerabilities, and weak validation.

---

## Section 5: How To Use the Agents
To maximize the productivity of these agents, follow the **Collaborative Loop** defined in `.agents/workflows/collaborative-loop.md`. You can instruct the agent framework to automatically sequence through:
1. Triggering the **Coder** to write the implementation.
2. Triggering the **Tester** to validate the Coder's changes.
3. Triggering the **Reviewer** to analyze the results and provide feedback in a continuous loop until accepted.
