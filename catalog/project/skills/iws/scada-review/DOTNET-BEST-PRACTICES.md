# .NET / C# — Modern Best Practices

Disclosed from [`SKILL.md`](SKILL.md). Generic, framework/language-level guidance that isn't already in `~/.claude/rules/*.md` (rung 1) and isn't a team-specific override in [`RULES.md`](RULES.md) (rung 3). Sits at rung 2 — see "Standards sources" in `SKILL.md`. RULES.md always wins on conflict.

Use this to flag findings the global rules and RULES.md don't cover — not as a second pass that re-derives what rung 1 already checks (EF query shape, primary constructors, Result pattern, naming — those live in `~/.claude/rules/`).

---

## 1. SOLID — the four global rules don't spell out

`~/.claude/rules/clean-code.md` covers SRP/DRY/KISS/YAGNI. These four are the rest of SOLID:

- **Open/Closed** — new behavior should be addable without editing tested, working code. A `switch` on a type enum that grows every sprint is a smell; polymorphism or a lookup table beats another `case`. But don't pre-build extension points for a variant that doesn't exist yet — that's YAGNI winning over OCP.
- **Liskov Substitution** — a derived type must be usable anywhere the base is expected without surprising the caller. An override that throws `NotSupportedException` for a subset of inputs the base type accepts is a violation — split the abstraction instead.
- **Interface Segregation** — no interface with methods half its implementers throw `NotImplementedException` on. Prefer several narrow interfaces (`IOrderReader`, `IOrderWriter`) over one fat one, when callers genuinely only need one side.
- **Dependency Inversion** — already enforced structurally by Clean Architecture (`Api → Application → Domain`), but watch for `Infrastructure.EF` types (e.g. `DbContext`, EF entities) leaking into `Application` signatures — that inverts the dependency back.

## 2. Structure — too much, and too little

`~/.claude/rules/design-patterns.md` (rung 1) carries the general symptom→pattern table, each pattern's cost, and the confusion pairs. Open it only once a finding is genuinely structural. This section is the C#/SCADA translation.

**Check the over-abstraction direction first.** This codebase has a DI container and settled layering, so surplus structure is the more common defect — and a reviewer who only ever asks for *more* structure trains the wrong instinct.

### Too much (C#-specific tells)

- An interface with exactly one implementation and no test-double need is a wrapper, not an abstraction — don't introduce `IFooService` until a second implementation or a mock is actually required.
- A generic `<T>` used with only one concrete type argument anywhere in the codebase is speculative generality — inline it.
- A `Manager`, `Helper`, or `Processor` class that aggregates unrelated static-ish methods is a dumping ground — split by actual responsibility or delete if the methods can live on the types they operate on.
- Mapping layers (manual or AutoMapper-style) that mirror the source type 1:1 with no transformation add a layer without adding value — project directly.
- **A container `Resolve<T>()` call inside business logic is Service Locator, not DI.** RULES.md §2 already flags the custom IoC; structurally it is worse than a perf issue — the dependency vanishes from the constructor, so the class lies about what it needs and can't be built in a test without the container. Resolve belongs at composition roots (entry points, background-service startup) only.
- **A new hand-rolled singleton where a container lifetime would do.** RULES.md §2 deprecates the `*Dao` classes and §7 documents the volatile + double-checked-locking idiom for what remains — that idiom is the *cost* of the pattern, not an endorsement. A new static `Instance` violates SRP by design (one instance **and** a global access point), carries its own thread-safety burden, and can't be mocked through a private constructor.
- **A class carrying a pattern name it hasn't earned** — an `XFactory` that `new`s up one concrete type, an `XStrategy` selected by a hard-coded constant.
- **A base class or shared helper grown into a God Object** — the right home for genuinely cross-cutting helpers, wrong the moment it accumulates members only one or two callers use.

### Too little

Each of these needs **two real occurrences quoted from the diff**. One occurrence plus an imagined third is not a finding, and per the Diff scope rule a shape that only exists outside the diff is a carry-over at most.

- **A repeated `switch`/`if` on a variable, driver, or protocol type** in two or more places → Strategy, one implementation per protocol, resolved from the container. With two stable variants a `Dictionary<TKey, Func<...>>` or a delegate is the right answer and class-per-strategy is overhead.
- **A DTO that gains a typed field per new subtype** (`OpcValue`, `ModbusValue`, …) → Open/Closed failing at the contract boundary. A generic `value` + `name` pair keeps the DTO stable as protocols are added.
- **Client code branching on "node or leaf?"** across a tag tree or location hierarchy → Composite. Only when the structure is genuinely recursive — a fixed two-level parent/child is not a tree.
- **A class thick with conditionals on its own status field**, many states, changing often → State. The WorkRequest lifecycle (RULES.md §2, terminal `FINISHED`/`ERROR`) is the candidate shape — but with a handful of stable states an enum plus a guarded transition method beats it.
- **A repeated read that needs caching** → a caching Proxy in front of the repository: same interface, callers unchanged. Beats scattering cache lookups through the service.
- **Near-identical background-service loops** (loop, try-catch the body, sleep outside the try, log the exception object) → the skeleton is a Template Method waiting for a base class, with the per-service work as the overridable step.
- **The same logic copy-pasted between microservices** — already RULES.md §2. Decide *what* is shared before extracting: a shared helper, or a shared abstraction each service implements differently.

### Liskov, where it actually bites here

- An override that throws `NotSupportedException`/`NotImplementedException` — the hierarchy is upside down; make the more restricted type the base.
- An override that weakens a postcondition. Concretely: RULES.md §2 fixes UnitOfWork ownership on the caller, so an override that calls `Complete()` itself — or one that leaves connections open where the base always closed them — breaks every caller.

## 3. Modern C# / .NET (12–13, .NET 8–9) — features worth using over older idioms

- **Primary constructors** on services/handlers (already in rung 1) — also apply to plain DTOs where a positional `record` reads awkwardly but a class doesn't need one.
- **Collection expressions** (`[]`, `[..existing, newItem]`) over `new List<T> { }` / `.Concat()` chains where the target type supports them.
- **`required` members** on DTOs/config classes instead of constructor boilerplate purely to enforce "must be set" — pairs well with `init`.
- **Pattern matching (`is`, `switch` expressions, list patterns)** over chained `if`/`as` — already in rung 1's style guide; extend to list patterns (`[var first, .. var rest]`) where it reads clearer than `.First()`/`.Skip(1)`.
- **`ArgumentNullException.ThrowIfNull(x)`** / `ArgumentException.ThrowIfNullOrEmpty(x)` over hand-written null checks at boundaries — but only at actual system boundaries per rung 1's "no defensive checks for internal code" rule.
- **`TimeProvider`** (injectable, testable clock) instead of `DateTime.Now` calls sprinkled through business logic — note this project's RULES.md explicitly keeps `DateTime.Now` over `UtcNow` for the *value*, `TimeProvider` is only about making time *testable*, not about which clock. Don't conflate the two — flag missing testability, not the `Now`/`UtcNow` choice.
- **`[GeneratedRegex]`** over `new Regex(...)` for compile-time-checked, faster regexes on hot paths.
- **Frozen collections (`FrozenDictionary`/`FrozenSet`)** for read-only lookups built once and read many times (e.g. static config maps) — cheaper reads than `Dictionary` at the cost of build time.

## 4. EF Core — beyond the rung-1 query rules

Rung 1 (`ef-core.md`) already mandates `AsNoTracking`, `Select`, no in-memory filtering, `AsSplitQuery`. Additional things worth flagging:

- **`ExecuteUpdateAsync` / `ExecuteDeleteAsync`** for bulk mutations instead of load-then-save loops — skips the change tracker entirely for set-based updates.
- **Compiled queries (`EF.CompileAsyncQuery`)** only on genuinely hot, repeatedly-shaped queries — not a default, a targeted fix once profiling shows the query plan cost matters.
- **Owned types / value converters** over a second table + join for value objects that never need independent querying.
- **Global query filters** for the project-scope isolation rule already in RULES.md §7 — enforcing `projectId` filtering in the entity configuration is more robust than remembering it in every query.

## 5. System design — lightweight checks for this codebase's shape

- **Idempotency at Kafka consumer boundaries** — any new consumer on `LIVE_VALUES_TOPIC`/`SEND_TO_CLIENT_TOPIC` etc. must tolerate at-least-once delivery (duplicate messages) without corrupting state.
- **Backpressure / bounded queues** — a new in-memory queue or `Channel<T>` between pipeline stages needs a bound; unbounded queues in a high-throughput SCADA read path are a memory-leak-shaped landmine.
- **Redis as cache, not source of truth** — any new code path that treats Storage/Process-Image Redis as durable (no DB fallback, no rebuild-on-miss path) is a design smell for this architecture.
- **Microservice boundary discipline** — a new field or behavior added to one microservice's model must be checked against every other service that deserializes the same Kafka message shape (already flagged in RULES.md §2 "Mikroservisna podrška").

---

Findings from this file are lower priority than a RULES.md hit unless they represent a genuine defect (e.g. LSP violation causing a runtime `NotSupportedException`, unbounded queue on a hot path) — default to 🟡/🟢 unless the failure mode is concrete and severe.
