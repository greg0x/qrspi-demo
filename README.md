# QRSPI Command Kit

**Composable Claude Code commands for routing, research, design, planning, implementation, and review.** Use one command when that is enough, or chain them into a QRSPI-style workflow for complex coding tasks.

## The Problem

The original [Research-Plan-Implement](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents) (RPI) workflow used 3 monolithic prompts with 85+ instructions each. Two things went wrong:

1. **Instruction budget overflow.** LLMs follow ~150-200 instructions reliably. A single 85-instruction prompt plus CLAUDE.md, tools, and MCP left little room. Steps got skipped — especially the interactive ones that required "magic words" to trigger.
2. **Decisions made too early.** By the time you saw the 1000-line plan, the agent had already made all the design decisions. Correcting course meant re-doing expensive work.

## The Solution

Split the work into standalone commands. Each command:

- Runs in its own context window
- Reads only the input artifacts it needs, not the full conversation history
- Produces a markdown file that feeds the next phase
- Stays under 40 instructions

```
Route → Question → Research → Design → Structure → Plan → Worktree → Implement → PR
```

| Command | What it does | Output |
|---|---|---|
| `/route` | Categorizes the task and selects model + effort | `route.md` |
| `/question` | Decomposes the task into neutral research questions | `task.md` + `questions.md` |
| `/research` | Answers questions with facts only — never sees the task | `research.md` (~300 lines) |
| `/design` | Aligns on approach with the user — MUST ask questions first | `design.md` (~200 lines) |
| `/structure` | Breaks design into vertical slices with test checkpoints | `structure.md` (~2 pages) |
| `/plan` | Creates tactical implementation details for the agent | `plan.md` |
| `/worktree` | Creates isolated git worktree for implementation | git worktree |
| `/implement` | Executes plan phase-by-phase, commits after each | code changes |
| `/pr` | Creates pull request grounded in the design document | GitHub PR |

The commands are top-level on purpose. You can run `/route` and stop, run `/research` with hand-written questions, start at `/design`, or go all the way through the full chain. The human reviews Design (~200 lines) and Structure (~2 pages) — not a 1000-line plan.

## Install

### Quick install (copy into your project)

```bash
# From your project root
git clone https://github.com/greg0x/qrspi-demo /tmp/command-kit

# Copy commands
mkdir -p .claude/commands
cp /tmp/command-kit/.claude/commands/*.md .claude/commands/

# Copy required agents
mkdir -p .claude/agents
cp /tmp/command-kit/.claude/agents/*.md .claude/agents/

# Clean up
rm -rf /tmp/command-kit
```

### Manual install

1. Copy the contents of `.claude/commands/` into your project's `.claude/commands/`
2. Copy the contents of `.claude/agents/` into your project's `.claude/agents/`
3. Both directories must exist at the root of your project

### Verify installation

Open Claude Code in your project and type `/route`, `/question`, or `/research` — you should see the top-level commands in autocomplete.

### Workshop runner: `cctt` + Legroom

For the workshop, run these commands through `cctt`, not `cot`. `cctt` points Claude Code at the local Legroom proxy (`ANTHROPIC_BASE_URL`, default `http://127.0.0.1:8787`) and uses Claude Code gateway model discovery.

Use Legroom's Claude Code aliases, not raw Keystone model names:

| Situation | Model alias |
|---|---|
| Default human coding: plans, debugging, implementation | `claude-legroom-gemini-3-flash-preview` |
| Fast ROI: repo triage, exploration, small edits | `claude-legroom-gemini-3-1-flash-lite` |
| Escalation/review: architecture, risky debugging, final review | `claude-legroom-gemini-3-5-flash` |
| Bulk cheap: summaries, extraction, classification, low-risk scans | `claude-legroom-gemini-2-5-flash-lite` |

This demo pins explicit `model:` fields to the cheapest Gemini route that is likely good for the command:

| Command or agent | Pinned model |
|---|---|
| `/route`, `/question`, `/research` | `claude-legroom-gemini-3-1-flash-lite` |
| `codebase-locator` | `claude-legroom-gemini-2-5-flash-lite` |
| `codebase-analyzer`, `codebase-pattern-finder` | `claude-legroom-gemini-3-1-flash-lite` |
| `web-search-researcher`, `/design`, `/structure`, `/plan` | `claude-legroom-gemini-3-flash-preview` |

Example:

```bash
LEGROOM_PROXY_MODEL=claude-legroom-gemini-3-flash-preview cctt
```

Then run the top-level slash commands inside Claude Code.

## Usage

```bash
# Optional: choose route, model, effort, and workflow depth
/route "Add rate limiting to the API endpoints"

# Start with a task description, ticket file, issue, or routed artifact directory
/question "Add rate limiting to the API endpoints"

# Each command tells you what to run next
/research thoughts/2026-03-29-rate-limiting/
/design thoughts/2026-03-29-rate-limiting/
/structure thoughts/2026-03-29-rate-limiting/
/plan thoughts/2026-03-29-rate-limiting/

# Optional: isolate work in a worktree
/worktree thoughts/2026-03-29-rate-limiting/

# Implement and ship
/implement thoughts/2026-03-29-rate-limiting/
/pr thoughts/2026-03-29-rate-limiting/
```

Start a fresh context window between phases for best results.

### Composable Usage

Use the full flow for complex, multi-file changes in existing codebases — the kind where getting the design wrong is expensive. For smaller work, compose only the commands you need:

- **Simple bug fix**: Skip to `/implement` with a hand-written plan
- **Small feature**: Start at `/design` if you already know the codebase
- **Complex feature**: Run the full chain from `/question` through `/pr`
- **Unclear model or workflow depth**: Start with `/route`

If a task can be described in one sentence and touches fewer than 3 files, the full workflow is overkill.

## How It Works

### Artifact flow

All artifacts for a task live in one directory:

```
thoughts/<task-id>/
├── route.md       # Task category, selected model, effort, next command
├── task.md         # What we're building (hidden from Research to prevent bias)
├── questions.md    # Neutral research questions
├── research.md     # Factual findings with file:line references
├── design.md       # Approach, decisions, patterns to follow
├── structure.md    # Vertical slices with verification checkpoints
└── plan.md         # Tactical implementation details with checkboxes
```

Each phase reads only its specified inputs — not the full set. Research never sees `task.md`. Design reads `task.md` + `research.md`. The plan reads everything. This prevents context pollution while keeping information available where it's needed.

### Key design decisions

**Research is intentionally blind to the task.** Phase 1 writes neutral questions; Phase 2 answers them as a documentarian. If the researcher knows what you're building, findings become opinions. Separating "what to ask" from "what to find" produces objective facts.

**Design forces interaction before writing.** The Design phase MUST present questions and wait for user input before producing the document. This is structural, not optional — eliminating the "magic words" problem where users had to know to ask for interaction.

**Vertical slices, not horizontal layers.** The Structure phase breaks work into end-to-end slices (migration + API + UI for one feature), not layers (all migrations, then all APIs, then all UI). Each slice is independently testable and verifiable.

**Checkboxes are the progress tracker.** Implementation updates `plan.md` checkboxes as phases complete. If a context window resets, the next session reads the checkboxes to know exactly where to resume.

**One commit per implementation phase.** Each phase is committed separately after verification passes, making individual phases independently revertable.

### Going backward

Not every task flows linearly. Each prompt includes a "When to Go Back" section:

- Research reveals bad questions — re-run Question
- Design finds missing research — re-run Question + Research
- Structure uncovers a flawed design — re-run Design
- Implementation hits a fundamental plan error — re-run Plan or Design

Small mismatches during implementation should be adapted in place. Fundamental issues warrant going back.

## Required agents

These commands reference these agents by name. They're included in `.claude/agents/`:

| Agent | Purpose | Tools |
|-------|---------|-------|
| `codebase-locator` | Finds where files and components live (fast, no reading) | Grep, Glob, LS |
| `codebase-analyzer` | Traces how code works with `file:line` references | Read, Grep, Glob, LS |
| `codebase-pattern-finder` | Finds existing patterns with code examples | Grep, Glob, Read, LS |
| `web-search-researcher` | External docs (only when explicitly requested) | WebSearch, WebFetch, Read, Grep, Glob, LS |

All agents operate as documentarians — they describe what exists, never suggest changes.

## File structure

```
.claude/
├── agents/
│   ├── codebase-analyzer.md
│   ├── codebase-locator.md
│   ├── codebase-pattern-finder.md
│   └── web-search-researcher.md
└── commands/
    ├── route.md
    ├── question.md
    ├── research.md
    ├── design.md
    ├── structure.md
    ├── plan.md
    ├── worktree.md
    ├── implement.md
    └── pr.md
```

## References

- ["Everything We Got Wrong About Research-Plan-Implement"](https://www.youtube.com/watch?v=YwZR6tc7qYg) — Dexter Horthy, MLOps.community, March 2026
- [Advanced Context Engineering for Coding Agents](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents) — the original RPI methodology and prompts
- [12 Factor Agents](https://github.com/humanlayer/12-factor-agents) — the agent design principles underlying this approach

## License

MIT
