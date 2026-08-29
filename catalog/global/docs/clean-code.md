# Clean Code Principles

Applies when: writing, modifying, or reviewing any code.

## Meaningful Names

- A name should reveal intent on its own — if it needs a comment to explain it, rename it instead.
- Avoid disinformation and encodings (Hungarian notation, `m_` prefixes, `l`/`O` as identifiers). Name length should scale with scope size.
- Classes are noun phrases (not `Manager`/`Processor`/`Data`); methods are verb phrases. One word per concept, never a pun for two meanings.

## Functions

- Small, one thing, one level of abstraction. If you can extract a sub-function whose name isn't just a restatement of the code, it was doing more than one thing.
- Few arguments (0–2 ideal, 3+ needs justification); group related ones into an object. Never a boolean flag argument — split into two functions.
- No output arguments, no hidden side effects — a function's name is a promise. Either do something or answer something, never both.
- Prefer exceptions over error codes; extract `try/catch` bodies into their own function.

## Comments

- The only truly good comment is the one you found a way not to write. Never comment bad code — rewrite it.
- Delete stale, redundant, journal-style, or commented-out code on sight — source control remembers it for you.

## Formatting

- Small files, read top-down like a newspaper (high-level first, detail last). Blank lines separate concepts; related lines stay dense.
- Declare variables close to their use, caller above callee. Never collapse a short `if`/loop onto one line. One team-wide formatter config, no individual style.

## Objects and Data Structures

- Objects hide data behind behavior; data structures expose data with no behavior — never build a hybrid of both.
- Law of Demeter: call methods only on self, created objects, arguments, or own fields — never chain through a returned object ("train wrecks"). Tell objects what to do; don't ask for their internals.

## Error Handling

- Exceptions, not return codes or `null`. Never return or pass `null` — throw, return a Special Case object, or return an empty collection.
- Every exception needs context (what failed, why). Wrap third-party exceptions in your own types, defined by how callers need to catch them.

## Boundaries

- Never let a third-party type leak through your public API — wrap it behind a narrow, purpose-built class.
- "It's better to depend on something you control than on something you don't, lest it end up controlling you."

## Unit Tests

- Test code gets the same design care as production code — dirty tests rot and eventually get abandoned, taking the safety net with them.
- F.I.R.S.T.: Fast, Independent, Repeatable, Self-validating, Timely (written just before the code they verify). One concept per test.

## YAGNI — You Aren't Gonna Need It

Only write the code a current, real requirement needs. No fields, hooks, or generic versions of logic for hypothetical future consumers.

## KISS — Keep It Simple

The simplest solution that correctly solves the problem wins. A flat `if/else` beats a pattern for two cases; a standard-library type beats a custom wrapper.

## SRP / OCP / DIP

- **SRP** — one reason to change per class; many small well-named classes beat a few large ones.
- **OCP** — add behavior via new classes (extension), not by editing tested existing ones (modification).
- **DIP** — depend on abstractions, not concrete details.

## DRY — Don't Repeat Yourself

Eliminate duplication once proven (rule of three) — but don't force an abstraction onto code that's only coincidentally similar; divergent copies are worse than harmless duplication.

## Coupling and Cohesion

Depend on interfaces, not concretions; pass what's needed, not the whole object. Things that change together belong together — when a class's cohesion drops, split it. Favor composition over inheritance.

## Systems

- Separate constructing the system (composition root / `main`) from using it — never resolve dependencies inline; inject them.
- Domain logic as plain objects, decoupled from frameworks. No Big Design Up Front — architecture grows incrementally, just like code.

## Emergent Design (Kent Beck, in priority order)

1. Runs all the tests. 2. No duplication. 3. Expressive (good names, small units, tests as documentation). 4. Minimal classes/methods (lowest priority — don't fragment to satisfy dogma).

## Concurrency

- Keep concurrency code separate from business logic; a dedicated, minimal set of classes owns thread management.
- Limit and encapsulate shared mutable data; prefer library-provided thread-safe collections over hand-rolled synchronization.
- Never dismiss an intermittent test failure as a fluke — assume it's a real concurrency bug.

## Smells and Heuristics (high-value subset)

- Duplication is the most important smell in the book — eliminate wherever found.
- Delete dead code, unused fields, and uncalled methods immediately.
- Replace magic numbers with named constants.
- One switch per type of selection, used only to build polymorphic objects.
- Feature Envy: a method that mostly manipulates another class's data belongs in that class.
- Names must say what they do, including side effects and mutate-vs-return semantics (`plusDays` vs `increaseByDays`, not ambiguous `add`).
- Don't casually disable warnings or skip failing tests "for later" — the safety exists for a reason.

## What NOT to do

- Do not introduce an abstraction to satisfy a single caller — wait for the second.
- Do not create base classes, generics, or interfaces "for future extensibility."
- Do not add overloads, optional parameters, or flags for cases that do not yet exist.
- Do not leave code in rough-draft form — "later equals never." The only way to go fast is to keep the code clean at all times.
