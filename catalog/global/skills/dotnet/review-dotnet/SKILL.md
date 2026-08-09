---
name: review-dotnet
description: Review a C#/.NET codebase, either as a guided architecture tour (learn the real conventions in use) or a ranked refactor audit (problems with why + how to fix).
disable-model-invocation: true
argument-hint: "tour|audit [path to project or solution]"
---

# .NET Codebase Review

Read-only. Never edit files or propose diffs to apply directly — every finding is something the
user writes the fix for themselves. This is a learning tool, not an auto-fixer.

## Setup (both modes)

1. Resolve the target: use the given path, or if none, ask which project/solution to look at.
2. Read every file in `~/.claude/rules/*.md` that applies to .NET (`dotnet-conventions.md`,
   `ef-core.md`, `api-conventions.md`, `api-design.md`, `code-style.md`, `clean-code.md`,
   `testing.md`, `security.md`, `git-workflow.md`). These are ground truth for what "good" looks
   like in this user's own codebases — not generic advice.
3. Skim the real project layout first (solution file, `.csproj` references, folder tree) before
   opening individual source files.

## Mode: tour

Goal: orient someone in a codebase they don't fully know yet.

- Map the physical folders to Clean Architecture roles (Api / Application / Domain / Contracts /
  Infrastructure.*) — say plainly where the mapping is clean and where it diverges.
- For each real convention actually in use (DI wiring, `Result<T>`, repository + unit of work,
  logging, auth, validation, testing setup) pull 1-2 concrete `file:line` examples and explain
  what it does and why it's shaped that way.
- Call out explicitly where the codebase matches vs. deviates from the user's own rule files,
  citing the specific rule file.
- Close with a short, ordered "read these files first" list for getting oriented fastest.

## Mode: audit

Goal: surface refactor-worthy problems, ranked, each with why it matters and how to fix it.

- Baseline: check against the user's rule files first. Fall back to general C#/.NET/Clean
  Architecture best practice (SOLID, dead code, naming, nullable correctness) only for what the
  rules don't cover.
- Severity scale: 🔴 breaks in production or security → 🟠 violates a hard rule and will bite
  later → 🟡 inconsistent/style → ⚪ cosmetic. Report most severe first.
- For each finding give:
  - `file:line`
  - **Why**: the concrete failure or cost this causes — not "bad practice", but what actually
    breaks and under what condition.
  - **Source**: the specific rule file/section it violates, or "general practice" if the rules
    don't cover it.
  - **Fix direction**: the shape of the correct approach, precise enough to attempt — not a full
    rewritten block. The user implements it.
- Default to signal over volume — skip pure cosmetic noise unless asked for everything.

## Output

A plain markdown report in chat. No file edits, no commits, no auto-generated fixes.
