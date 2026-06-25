---
name: qrspi
description: Use when the user wants QRSPI-style coding workflow support, task/model routing, neutral codebase research, design discussion, vertical slicing, implementation planning, phased implementation, PR preparation, or wants to install the bundled Claude Code slash commands and agents.
---

# QRSPI Command Kit

This skill provides a composable coding workflow for Claude Code:

- route the task to the cheapest likely-sufficient model and effort level
- ask neutral research questions before design decisions
- research what exists without proposing solutions
- align on design with explicit human decisions
- slice work vertically before planning
- create an implementation plan with verification checks
- implement one checked phase at a time
- prepare a PR grounded in the design and diff

## Installed Skill vs Slash Commands

`npx skills add` installs this skill into Claude Code's skill directory, usually `.claude/skills/qrspi/` for project installs or `~/.claude/skills/qrspi/` for global installs.

That does not automatically register Claude Code slash commands. Slash commands live in `.claude/commands/`, and agents live in `.claude/agents/`.

If the user asks to install the slash commands, run the bundled installer from the project root:

```bash
node .claude/skills/qrspi/scripts/install-command-kit.mjs
```

For a global skill install, pass the installed skill path explicitly if needed:

```bash
node ~/.claude/skills/qrspi/scripts/install-command-kit.mjs /path/to/project
```

## Slash Commands

The bundled command assets install these top-level commands:

- `/route` - categorize task, select model, select effort, choose shortest useful workflow path
- `/question` - create `task.md` and neutral `questions.md`
- `/research` - answer questions with codebase facts only
- `/design` - align on design decisions with the user before writing `design.md`
- `/structure` - break the design into vertical slices
- `/plan` - create an implementation plan with verification checks
- `/worktree` - create an isolated git worktree
- `/implement` - execute the plan phase by phase
- `/pr` - create a PR description grounded in design and diff

## Model Routing

Use Legroom Claude Code model aliases, not raw Keystone model names:

| Situation | Model alias |
|---|---|
| Bulk lookup, location, low-risk scans | `claude-legroom-gemini-2-5-flash-lite` |
| Research, pattern discovery, small edits | `claude-legroom-gemini-3-1-flash-lite` |
| Design, structure, planning, default coding | `claude-legroom-gemini-3-flash-preview` |
| Risky debugging, migration, final review | `claude-legroom-gemini-3-5-flash` |
| Deep escalation after a failed concrete check | `claude-legroom-gemini-3-1-pro-preview` |

Start with the cheapest model that can probably complete the task. Escalate only when the result fails a concrete check.

## Workflow Guidance

Do not force the full workflow. Pick the shortest useful path:

- one-off answer: answer directly
- unclear model/workflow depth: `/route`
- unknown codebase facts: `/question` then `/research`, or `/research` with hand-written questions
- known facts but unclear direction: `/design`
- agreed direction but no slices: `/structure`
- agreed slices but no agent-ready plan: `/plan`
- reviewed plan exists: `/implement`
- implementation is done: `/pr`

Artifacts usually live under `thoughts/<task-id>/`, but any directory with the expected files works.

## Safety

Treat installed skills and commands as part of the instruction supply chain. For third-party or workshop demo material, review generated diffs before sharing or merging code across a human boundary.
