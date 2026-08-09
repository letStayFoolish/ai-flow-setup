---
name: ef-core-query-review
description: Audits EF Core LINQ queries against 10 production performance rules (N+1, over-fetching, missing AsNoTracking, lazy loading, cartesian explosion, post-materialization filtering, load-to-mutate, no pagination, missing indexes, no compiled queries on hot paths). Use when reviewing EF Core queries, writing new repository methods, auditing a codebase for query performance, or when user asks about LINQ-to-SQL, Include vs Select, AsNoTracking, bulk updates, EF Core performance, or query optimization.
---

# EF Core Query Review

## How to Start

Ask: "Which mode?  
**1 — Audit**: scan a path for existing violations  
**2 — Review**: check a specific query or file  
**3 — Write**: pair on building a correct query from scratch"

If the user pastes a query without asking, go straight to Mode 2.

---

## Mode 1 — Codebase Audit

Run the grep patterns from MISTAKES.md against the target path. Then:

1. Group findings by mistake number (1–10).
2. Present **one mistake at a time** — never dump everything at once.
3. For each finding, quote the offending lines and explain **what EF Core does at runtime** (no fix yet): what SQL fires, how many rows cross the wire, what happens when the table grows to 1M rows.
4. Ask the Socratic prompt from MISTAKES.md for that mistake.
5. Wait for the user's answer. Give targeted feedback, then ask them to write the fix.
6. Only show the correct pattern after the user has made **two genuine attempts**.
7. After the fix is written: *"Why is this version faster? What specifically changed in the SQL?"* — confirm understanding before moving on.
8. Continue to the next finding only after the previous one is understood.

---

## Mode 2 — Query Review

Run the 10-point checklist silently against the pasted query. Then:

- **No issues**: confirm which checks it passes and briefly explain why each matters for this specific query.
- **Issues found**: name the mistake(s), explain the runtime consequence, use the Socratic flow from Mode 1 (steps 4–7).

---

## Mode 3 — Writing a New Query Together

Step through in order, confirming each before the next:

1. **Is this a read?** → start with `.AsNoTracking()`
2. **Filters and sorts** → confirm they are inside the `IQueryable` chain, before any terminal operator
3. **Projection** → `.Select(...)` to the exact DTO shape; flag any `Include` that could be replaced by projection
4. **Multiple collection Includes?** → check for cartesian explosion, offer `AsSplitQuery`
5. **List endpoint?** → confirm `Skip`/`Take` are present; cap `pageSize` server-side
6. **Bulk update or delete?** → redirect to `ExecuteUpdateAsync`/`ExecuteDeleteAsync`

---

## Teaching Rules — non-negotiable

- **Never paste a complete fix unprompted.** Ask the user to write it first.
- Always explain the runtime consequence **before** asking for the fix.
- After the fix is written, always ask *why* it is faster to confirm the mental model, not just the syntax.
- When the user is stuck: give a hint pointing to the relevant section in MISTAKES.md, not the answer.
- The goal is that the user leaves with understanding, not just working code.

---

## Reference

See [MISTAKES.md](MISTAKES.md) for grep patterns, runtime explanations, and Socratic prompts for all 10 mistakes.
