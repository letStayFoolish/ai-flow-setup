# .NET / C# — Modern Best Practices

Disclosed from [`SKILL.md`](SKILL.md) — sole source for the **Best Practices** axis (see "The three axes" there). This axis runs independent of Standards: its sub-agent never sees `RULES.md` or `~/.claude/rules/*.md`, so don't assume it and don't try to hand-tune this file to dodge overlap. Any duplicate finding between axes gets merged when `REVIEW-FLOW.md` aggregates (step 6) — that's where overlap gets resolved, not here.

Generic, framework/language-level guidance — modern C#/.NET, EF Core, SOLID, design patterns — independent of this repo's own conventions.

---

## 1. SOLID — the four global rules don't spell out

`~/.claude/rules/clean-code.md` covers SRP/DRY/KISS/YAGNI. These four are the rest of SOLID:

- **Open/Closed** — new behavior should be addable without editing tested, working code. A `switch` on a type enum that grows every sprint is a smell; polymorphism or a lookup table beats another `case`. But don't pre-build extension points for a variant that doesn't exist yet — that's YAGNI winning over OCP.
- **Liskov Substitution** — a derived type must be usable anywhere the base is expected without surprising the caller. An override that throws `NotSupportedException` for a subset of inputs the base type accepts is a violation — split the abstraction instead.
- **Interface Segregation** — no interface with methods half its implementers throw `NotImplementedException` on. Prefer several narrow interfaces (`IOrderReader`, `IOrderWriter`) over one fat one, when callers genuinely only need one side.
- **Dependency Inversion** — already enforced structurally by Clean Architecture (`Api → Application → Domain`), but watch for `Infrastructure.EF` types (e.g. `DbContext`, EF entities) leaking into `Application` signatures — that inverts the dependency back.

## 2. Avoid unnecessary abstraction (C#-specific tells)

- An interface with exactly one implementation and no test-double need is a wrapper, not an abstraction — don't introduce `IFooService` until a second implementation or a mock is actually required.
- A generic `<T>` used with only one concrete type argument anywhere in the codebase is speculative generality — inline it.
- A `Manager`, `Helper`, or `Processor` class that aggregates unrelated static-ish methods is a dumping ground — split by actual responsibility or delete if the methods can live on the types they operate on.
- Mapping layers (manual or AutoMapper-style) that mirror the source type 1:1 with no transformation add a layer without adding value — project directly.

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

Default findings from this file to 🟡/🟢 unless the failure mode is concrete and severe (e.g. LSP violation causing a runtime `NotSupportedException`, unbounded queue on a hot path) — those earn 🟠/🔴.
