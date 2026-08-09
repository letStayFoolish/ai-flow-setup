# Feature Deep Dive — Reference

## Phase 2 — Reading Checklist

Read at least:

- One full implementation per layer (service method, repo method, controller action).
- The entity base class, result/error types, shared abstractions — these set the codebase's idioms.
- DI registration (e.g. `Program.cs`) — architectural decisions live here.
- Tests — even empty test projects tell you something.

---

## Phase 3 — Debt Format

For each debt item, include all four:

1. **Where** — file + method/line.
2. **Code excerpt** — paste the lines, don't paraphrase.
3. **What's wrong** — name the principle violated (SRP, DIP, layer rule, etc.) and why it matters in practice.
4. **What good looks like** — point to a better example already in the codebase, or describe the correct approach.

Rank by impact: an architectural mistake outweighs a naming inconsistency.

---

## Phase 5 — Step Template

```
Step N — <Name>
  File: <Layer>/<Path>.cs
  Model after: <Layer>/<ExistingFile>.cs
  Why: <Pattern> + <Principle> — <what it achieves>.
  Tests: <what to write, or "none yet; tested via X">
```

Example:

```
Step 1 — Define the command model
  File: Application/Commands/CreateOrderCommand.cs
  Model after: Application/Commands/UpdateInventoryCommand.cs
  Why: Command pattern + SRP — separates entry-point shape from handler logic.
  Tests: none yet; tested via handler.
```

---

## Phase 6 — Guided Build Checklist

- **Explain before writing.** One or two sentences connecting the step to the bigger picture, then code.
- **Name patterns when introduced.** Before/after + the pain the pattern removes. Patterns without problems are vocabulary.
- **Surface idioms juniors miss** — `IAsyncEnumerable`, cancellation tokens, `ConfigureAwait`, EF Core tracking state, `IOptions<T>` vs. snapshot/monitor, scoped vs. transient registration, nullable reference types — call them out as they come up.
- **Tests alongside, not after.** Explain what each test checks and why.
- **Refactoring discipline** — when touching legacy code: state what's wrong, why it's wrong, whether fixing it is in scope now or later. Never silently model bad code. If fixing now, isolate the refactor from the new feature commit.
- **Check understanding per step** — one question, not a quiz. "Does the reason for putting this in the application layer rather than the handler make sense?" not "what does SRP stand for?"

---

## Phase 4 — Domain Language Rules

**During the interview, enforce domain language discipline:**

- When the user uses a term that conflicts with `CONTEXT.md`, call it out immediately: *"Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"*
- When the user uses vague or overloaded terms, propose a canonical term: *"You're saying 'event' — do you mean a domain event, a SCADA hardware event, or a UI notification? Those are different things."*
- When domain relationships are discussed, stress-test with concrete scenarios that probe edge cases.
- When the code contradicts what the user says, surface it: *"Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"*
- When a term is resolved, update `CONTEXT.md` immediately — don't batch. If no `CONTEXT.md` exists, create it at the repo root on the first resolved term.

**`CONTEXT.md` format:**

```md
# {Context Name}

{One or two sentences: what this context is and why it exists.}

## Language

**Term**:
Concise definition — what it IS, not what it does. One sentence max.
_Avoid_: synonym1, synonym2

## Relationships

- A **Foo** belongs to exactly one **Bar**

## Flagged ambiguities

- "account" was used to mean both **Customer** and **User** — resolved: these are distinct.
```

Only include terms specific to this domain — not general programming concepts.

---

## Phase 5.5 — ADR Criteria and Format

**Offer an ADR only when all three are true:**

1. **Hard to reverse** — cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will wonder "why on earth did they do it this way?"
3. **Real trade-off** — genuine alternatives existed and one was picked for specific reasons

If any of the three is missing, skip it.

**What qualifies:** architectural shape, integration patterns between services, technology choices with lock-in, deliberate deviations from the obvious path, constraints not visible in the code, rejected alternatives whose rejection is non-obvious.

**ADR format** (`docs/adr/NNNN-slug.md`):

```md
# {Short title of the decision}

{1–3 sentences: what's the context, what did we decide, and why.}
```

That's it. Optionally add `Considered Options` or `Consequences` only when they add genuine value. Scan `docs/adr/` for the highest existing number and increment by one.

---

## Logic Trace — Full 6-Step Walkthrough

1. **Get specific.** "How does a transaction get created" beats "how does `TransactionService` work."
2. **Walk the path.** At each step: name the class + method, paste the relevant code (don't describe it), explain what it does and why it's shaped that way, flag the non-obvious — async behavior, error propagation, DI resolution, EF Core tracking state, middleware ordering. Follow every branch that matters.
3. **Brief check-in per step.** "Make sense?" — not a quiz.
4. **Closing summary.** One paragraph: trigger → key decisions → outcome → one meaningful edge case.
5. **Offer adjacent branches.** "Want to trace the error path / the retry / the alternate caller?"
6. **Transition check (always ask):** *"Now that we've walked through how this works — do you want to continue into implementation, or was understanding the goal?"*
   - **Implementing** → ask Mentor or Delivery depth → jump to **Phase 4** with shared context. Skip 1–3. Interview goes straight to design intent.
   - **Understanding** → close, or offer to trace another area.
