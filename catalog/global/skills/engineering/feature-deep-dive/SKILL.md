---
name: feature-deep-dive
description: Use whenever the user is about to work on something in a codebase — new feature, bug fix, refactor, ticket, code review, or 'I want to understand this code before touching it'. Trigger phrases: 'I need to implement X', 'let's work on this ticket', 'refactor Y', 'where do I start with Z', 'help me build this right', 'how does X actually work', 'walk me through this flow', 'is there anything worth improving here'. Five modes — Mentor (deep teaching), Delivery (build correctly with key context), Health Check (find what's worth improving), Logic Trace (understand current behavior), Trace+Build (trace then implement). Especially valuable in large, complex, or legacy codebases where context before coding is the difference between a good change and a liability. Do NOT trigger for quick syntax questions, library API lookups, or general concepts with no active codebase involved.
---

# Feature Deep Dive

## Step 0 — Pick the Mode

Ask once. If the user's message already makes it obvious, infer and confirm in one line.

1. 🎓 **Mentor** — understand deeply. Explain everything, challenge me, don't rush.
2. 🚀 **Delivery** — get this done correctly. Build it right, teach only what matters.
3. 🔍 **Health Check** — no task. Show me what's worth improving; I'll pick.
4. 🧭 **Logic Trace** — walk me through how this works. No code changes (yet).
5. 🧭→ **Trace + Build** — trace first, then implement. Ask: "After tracing, build at Mentor or Delivery depth?"

**Depth dial across phases:**
- Mentor → max depth, all phases, slow.
- Delivery → narrow horizontal scope to the task; skip non-blocking debt; concise plan.
- Health Check → full Phase 2 + 3, then short Phase 4 once the user picks a target.
- Logic Trace → Phase 1 + 2 (execution path only) → Trace Walkthrough. Skip 3–6.
- Trace+Build → trace IS the archaeology. Jump straight to Phase 4 with shared context. Never re-run 1–3.

In large solutions (e.g. 70+ microservices), stay disciplined: go as wide as the task requires and no wider.

---

## Phase 1 — Intake

Two or three questions: what, type (new/fix/refactor/explore), which service/area, what has the user already looked at. Direction, not a requirements doc.

---

## Phase 2 — Codebase Archaeology

Memory is a starting point, not a substitute — always open and read actual files. Method bodies, not just filenames. See [REFERENCE.md](REFERENCE.md) for the full reading checklist.

**Vertical:** trace entry → handler/controller → application → domain → repository/infrastructure → persistence. Read each layer's actual code.

**Horizontal:** find every external connection — other services in/out, shared contracts, events published/consumed, shared tables, config dependencies.

**Output a Map and confirm with the user:** layers touched, affected services, what to model after, what to avoid repeating.

---

## Phase 3 — Standards Snapshot

Quality bar = a real code review, not a summary. Don't move on until every significant issue has a code example attached. See [REFERENCE.md](REFERENCE.md) for the full debt format.

**Good patterns** — name what to model after: folder/naming conventions, cleanest service or handler (name the file), how cross-cutting concerns are handled.

**Debt & issues** — for each: where, code excerpt, what principle is violated, what good looks like. Rank by impact. Name SOLID principles and patterns explicitly — symptoms are not enough. Present the full snapshot before any interview question.

---

## Phase 4 — The Interview

5–8 questions, **one at a time** — wait for each answer before continuing. Designed to surface assumptions, gaps, and edge cases before they're baked into code:

- **Domain** — what is this doing in business terms, who triggers it, what are the edge cases?
- **Architecture & fit** — which layer does the core logic belong in, and does the user know why? Which Phase 2 horizontal dependencies apply?
- **Requirements** — what's unspecified in the ticket, what happens on failure, any perf/concurrency concerns?
- **Design intent** — what alternatives exist, what are the tradeoffs, which codebase patterns apply?

**Domain language discipline:** challenge any term that conflicts with the existing glossary (`CONTEXT.md` if present). Sharpen fuzzy language — when the user says "account" or "event", ask which specific concept they mean. When a term is resolved, update `CONTEXT.md` inline. If no `CONTEXT.md` exists, create it on the first resolved term. See [REFERENCE.md](REFERENCE.md) for domain language rules and format.

Push back on vague answers. "I'll figure it out as I go" is how debt starts.

---

## Phase 5 — Implementation Plan

Step-by-step, each step: what + where (layer, file, project), why (principle/pattern), model after (existing file), tests. Share before building. Get agreement. See [REFERENCE.md](REFERENCE.md) for the step template and example.

**Structure check — before writing the plan, not after.** This is the last cheap moment to choose the shape; after Phase 6 it costs a rewrite. Read `~/.claude/rules/design-patterns.md` and answer three questions in the plan itself:

1. **What varies here?** Name the axis this feature changes along, and where in the plan that variation is isolated. If it isn't isolated, say why that's acceptable.
2. **Does the codebase already have a shape for this?** Phase 2 found what to model after — an existing Strategy set, a repository convention, a base controller. Matching the existing shape beats introducing a better one; say so explicitly when you're matching.
3. **Is any new abstraction in this plan earned?** For each interface, factory, or base class the plan introduces: does a second concrete implementation exist *today*, or does it cross an architectural boundary? If neither, cut it from the plan. The YAGNI rule in `~/.claude/rules/clean-code.md` applies to plans exactly as it applies to code.

Keep this to a short paragraph in Delivery mode. In Mentor mode, walk the user through the three questions rather than answering them — this is where pattern knowledge actually gets built.

---

## Phase 5.5 — Plan Stress-Test

Grill the plan before a single line is written. Challenge each step: does the layer placement hold up, are edge cases covered, do alternatives exist that the plan ignores? Cross-reference with code — if the plan assumes something about existing behavior, verify it by reading the file. For any decision that is hard to reverse, surprising without context, and the result of a real trade-off, offer an ADR. See [REFERENCE.md](REFERENCE.md) for ADR criteria and format.

---

## Phase 6 — Guided Build

Hands-on. The user writes wherever possible; you guide. Explain before writing. Name patterns when introduced — before/after + the pain removed. Test alongside, not after. See [REFERENCE.md](REFERENCE.md) for the full checklist.

---

## Logic Trace Walkthrough (🧭 modes)

Replaces Phases 4–6 for pure Logic Trace. Walk each step: name the class + method, paste the relevant code, explain what it does and why, flag the non-obvious. Always end with a transition check: implement or just understand? See [REFERENCE.md](REFERENCE.md) for the full 6-step walkthrough.
