---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Before writing code, run a one-paragraph **structure check** against `~/.claude/rules/design-patterns.md`: what varies in this work, what shape the codebase already uses for it, and whether every abstraction you are about to introduce is earned *today* — a second concrete implementation exists, or it crosses an architectural boundary. Cut whatever isn't. Skip this for mechanical or single-file changes, and skip it entirely if the work came through `/feature-deep-dive` — its Phase 5 already did it.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.
