---
name: fix-failing-test
description: Paste a CI test-failure block (name, stack trace, failure history) and get it root-caused and fixed test-side where possible, with the whole test class re-run as proof. Flags a real production bug instead of patching it, and waits for your go-ahead.
disable-model-invocation: true
---

# Fix Failing Test

You are the **orchestrator**. Each failing test class is fixed by its own subagent in a fresh context; you hold only the plan and the reports. Your context stays lean so a 10-test paste gets the same depth on test 10 as on test 1.

## Step 1 — Split into work units

From the pasted CI block, extract every failing test: fully qualified `Namespace.Class.Method`, its stack trace, and its "Failed N times in develop in the last M days" line if present.

Group by `Namespace.Class`. One class = one **work unit**: tests in the same class share a test file and a class-level verify run, so one worker owns them together.

Done when every failing test from the paste sits in exactly one unit. List the units to the developer before dispatching.

## Step 2 — Dispatch, one unit at a time

For each unit, spawn one `general-purpose` subagent (Agent tool). Its prompt carries:

- the absolute path of [`WORKER.md`](WORKER.md) in this skill's base directory, with the instruction to read it first and follow it
- the unit's raw CI excerpt, verbatim: test names, stack traces, failure-history lines

Dispatch **sequentially**: wait for each report before spawning the next. Workers share the working tree, the `bin`/`obj` build output, and the DB/Kafka/Redis the tests hit; parallel runs collide and manufacture flakiness.

Done when every unit has returned a report.

## Step 3 — Report

Give the developer one table, one row per test: test, outcome (`fixed` / `production-bug` / `unresolved`), one-line root cause, files changed.

Below it, for each `production-bug`: the worker's failing assertion, the root cause in production code, and the behavior change a fix would introduce. Wait for explicit go-ahead per bug. On go-ahead, resume that same worker via SendMessage so it fixes production code with its context intact, then re-runs its WORKER.md Step 5.
