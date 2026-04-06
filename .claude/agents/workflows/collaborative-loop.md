---
description: How to run the collaborative agent loop using the Coder, Tester, and Reviewer
---

# Collaborative Agent Loop

This workflow documents how to trigger and utilize the three agents (`coder.md`, `tester.md`, and `reviewer.md`) in a continuous development cycle.

## Prerequisites
Ensure that the agents have been defined in `.claude/agents/` and the ruleset is documented in `AGENT_RULESET.md`.

## Workflow Steps

1. **Step 1: Start the Loop**
   Invoke the agent framework and provide your feature request. Instruct it to act as the **Coder Agent** first.
   *Example Prompt:*
   > "Acting as the Coder Agent, implement a new API endpoint in `server/requests` to handle user telemetry. Follow the rules in `AGENT_RULESET.md`."

2. **Step 2: Generate Tests**
   Once the implementation is complete, instruct the active session to switch context to the Tester.
   *Example Prompt:*
   > "Switching to the Tester Agent: Please write unit tests that cover the recent telemetry endpoint feature. Ensure network calls are mocked and edge cases are evaluated."

3. **Step 3: Begin Code Review**
   Finally, switch context to the Reviewer Agent to scrutinize both the code and the tests.
   *Example Prompt:*
   > "Switching to the Reviewer Agent: Perform a complete code review on both the Coder's implementation and the Tester's unit tests. If there are any logic bugs, architecture flaws, or coverage gaps, outline them clearly and suggest code fixes. Leave comments if needed."

4. **Step 4: Refinement (If rejected by the Reviewer)**
   If the Reviewer suggests changes, pipe those changes back to the Coder.
   *Example Prompt:*
   > "Back to the Coder Agent: Please apply the architectural changes and bug fixes suggested by the Reviewer."

5. **Step 5: Final Validation**
   Rerun the tests to ensure nothing broke during refinement. Once tests turn green and the Reviewer approves implicitly, you may commit the finalized code.