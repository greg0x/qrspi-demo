---
description: Categorize a task and choose the cheapest likely-sufficient model and effort route
model: claude-legroom-gemini-3-1-flash-lite
argument-hint: "<task description, ticket file, issue URL, or thoughts/<id>/ directory>"
---

# Route — Select Task Category, Model, and Effort

Classify the task before choosing model spend or workflow depth. Use this command by itself for quick routing, or before `/question`, `/research`, `/design`, `/plan`, or `/implement` when the next step is not obvious.

## Input

The user provides a task description, ticket file, issue reference, or an existing artifact directory.

If `$ARGUMENTS` is a directory:
- Read `$ARGUMENTS/task.md` if present.
- Read `$ARGUMENTS/route.md` if present and update it instead of creating a duplicate.
- Do not require the rest of the workflow artifacts to exist.

## Process

1. **Read provided files fully** before classifying.

2. **Do minimal discovery only if needed.**
   - If the task mentions specific files, use those.
   - If the task is vague, use `codebase-locator` for a light map.
   - Do not implement, design, or write a plan in this command.

3. **Choose the task category:**

   | Category | Use when | Model | Effort |
   |---|---|---|---|
   | `lookup` | Locate files, answer a narrow codebase question, summarize known material | `claude-legroom-gemini-2-5-flash-lite` | `low` |
   | `research` | Neutral fact-finding, pattern discovery, architecture tracing | `claude-legroom-gemini-3-1-flash-lite` | `low` or `medium` |
   | `clear-edit` | Small code/doc edit with known files and clear acceptance checks | `claude-legroom-gemini-3-1-flash-lite` | `medium` |
   | `planned-edit` | Multi-file implementation where the approach is mostly clear but needs a reliable plan | `claude-legroom-gemini-3-flash-preview` | `medium` |
   | `ambiguous-feature` | Design choices, multiple layers, unclear scope, or important user-facing behavior | `claude-legroom-gemini-3-flash-preview` | `high` |
   | `high-risk` | Migration, data loss risk, security, auth, cross-system change, hard debugging, or final review | `claude-legroom-gemini-3-5-flash` | `high` |
   | `deep-escalation` | A cheaper route already failed a concrete check and the remaining risk is expensive | `claude-legroom-gemini-3-1-pro-preview` | `escalation` |

4. **Select the next command path.** Prefer the shortest path that preserves control:
   - One-off answer: no next command.
   - Unknown codebase facts: `/question` then `/research`, or `/research` with hand-written questions.
   - Design alignment needed: `/design`.
   - Slice breakdown needed: `/structure`.
   - Agent-ready implementation needed: `/plan`, then `/implement`.
   - Existing reviewed plan: `/implement`.
   - Review or PR packaging: `/pr`.

5. **Define escalation checks.** Name the concrete evidence that would justify a stronger model:
   - failed tests or type checks after one targeted repair
   - hallucinated files, APIs, or project conventions
   - conflicting architectural assumptions
   - unclear design trade-off that needs human judgment
   - security, data, or production-risk concern

6. **Write or update `route.md`** if an artifact directory is available or the task is substantial:

   ```markdown
   # Task Route

   ## Task
   [2-3 sentence description]

   ## Category
   `[category]`

   ## Selected Model
   `[claude-legroom-* alias]`

   ## Effort
   `[low | medium | high | escalation]`

   ## Why This Route
   [Short rationale based on scope, uncertainty, risk, and verification cost]

   ## Recommended Next Step
   [Command or direct action]

   ## Escalation Checks
   - [Concrete check]
   - [Concrete check]

   ## Explicit Non-Goals
   [What this route should not include]
   ```

7. **If no artifact directory exists and the task is substantial**, propose an artifact directory name under `thoughts/<id>/`. Ask before creating it unless the user clearly asked to start the workflow.

## Output

- A concise routing recommendation in chat.
- Optional `thoughts/<id>/route.md`.
- If useful, the launch hint:
  ```bash
  LEGROOM_PROXY_MODEL=<selected-model> cctt
  ```

## Rules

- Start with the cheapest model that can probably complete the task.
- Escalate only when the result fails a concrete check.
- Do not choose `high-risk` or `deep-escalation` because a task feels important; name the actual risk.
- Do not force the full Question -> Research -> Design -> Structure -> Plan -> Implement flow for small tasks.
- Keep the route short enough that a human can use it as a decision note, not a second plan.
