# Design Patterns — Selection Reference

Applies when: designing a module, choosing where behaviour lives, or reviewing a change that introduces (or should introduce) an abstraction.

Companion to [clean-code.md](clean-code.md), which governs **whether** to add structure (YAGNI, KISS, SRP, DRY, coupling/cohesion). This file governs **which** structure, once the need is real. Language-specific tells for over-abstraction in C#/.NET live in the `scada-review` skill's `DOTNET-BEST-PRACTICES.md`; this file is stack-agnostic.

**This file never overrides YAGNI.** A pattern is a response to pain that already exists in the code — duplication you can point at, a conditional that has already grown twice, a class that has already been edited for three unrelated reasons. A pattern applied to *anticipated* pain is Speculative Generality with a respectable name. When in doubt, write the simple version and wait for the second concrete case.

Read this file when you are about to make a structural decision: designing a new module, choosing where behaviour lives, or reviewing a change that introduces (or should introduce) an abstraction.

---

## The three design principles behind every pattern

Almost every pattern below is one of these three applied to a specific shape of problem. If a proposed pattern doesn't trace back to one of them, it is decoration.

**1. Encapsulate what varies.** Identify the parts of the system that change for their own reasons and separate them from the parts that stay still. Start at method level (extract the varying calculation), escalate to class level only when the extracted logic grows its own fields and helpers.

**2. Program to an interface, not an implementation.** Determine what the caller actually needs from the callee, describe exactly that in an interface, and depend on it. Note the cost the book is honest about: immediately after extracting an interface the code is *more* complicated and *no* more useful. It pays off only if a second implementation or a real extension point arrives.

**3. Favour composition over inheritance.** Inheritance is the cheapest reuse and the most expensive coupling. Its specific failure modes: a subclass cannot narrow the superclass interface; overrides must stay behaviour-compatible; the subclass sees the parent's internals; and reuse across two independent dimensions produces a combinatorial explosion of subclasses. When you find yourself extending along a second axis, that is the signal to compose.

---

## Symptom → candidate pattern

This table is the working half of this file. Match on the **symptom you can already see in the diff**, not on the design you imagine.

| Symptom in the code | Candidate | Prove it first |
| --- | --- | --- |
| Constructor with many optional params, or a stack of overloads | Builder | Are the params really optional, or is one object hiding two? |
| `new ConcreteThing()` inside logic that shouldn't know the concrete type | Factory Method | Is there a second concrete type today? |
| Objects from several families must stay mutually compatible | Abstract Factory | Do the families actually exist, or is there one? |
| Copying objects whose concrete class the copier shouldn't know | Prototype | Would a plain copy constructor do? |
| Genuinely one instance, and global mutable access is the requirement | Singleton | Almost always: use DI with a single registered lifetime instead |
| Third-party / legacy interface doesn't fit the calling code | Adapter | Could you just change the callee? |
| A class is being extended along two independent axes | Bridge | Are the axes truly orthogonal? |
| Client code branches on "is this a leaf or a container?" | Composite | Is the structure actually recursive? |
| Optional behaviours that must combine at runtime in arbitrary order | Decorator | Do the combinations actually occur? |
| Callers must run six setup calls in the right order to use a subsystem | Facade | Is the subsystem's own interface just bad? |
| Huge object count, identical repeated state, RAM is the actual constraint | Flyweight | Have you measured? |
| You need lazy init, access control, caching, or logging around a service | Proxy | Would middleware/an interceptor be simpler? |
| A request must be offered to several handlers, order matters, set is dynamic | Chain of Responsibility | Is the chain dynamic, or a fixed if/else? |
| Operations must be queued, logged, scheduled, sent remotely, or undone | Command | Do you need any of those *today*? |
| Traversal logic is duplicated, or hides a structure clients shouldn't see | Iterator | Does the language already give you this? |
| N components each hold references to the other N−1 | Mediator | Watch for the mediator becoming a God Object |
| You need snapshot/rollback without exposing internals | Memento | Is the state simple enough for Prototype? |
| One object changes; an unknown, changing set must react | Observer | Is the subscriber set really dynamic? |
| A class is full of conditionals on its own status field, and states are many | State | How many states, and how often do they change? |
| A repeated `switch`/`if` picking between variants of the same algorithm | Strategy | In a language with first-class functions, a delegate may be enough |
| Several classes run near-identical algorithms differing in a few steps | Template Method | Would Strategy (composition) be better than inheritance here? |
| An unrelated operation must run over a whole heterogeneous object tree | Visitor | Every new element type will force every visitor to change |

---

## Catalog

Each entry: **what it is → the trigger that earns it → what it costs.** The cost line is the one that matters at review time.

### Creational

**Factory Method** — subclasses decide which concrete product to create.
*Earns it:* the exact type isn't known where the object is used; or a framework needs a documented extension point; or creation must reuse pooled objects (a constructor cannot return an existing instance).
*Costs:* one creator subclass per product type. Cheapest when a creator hierarchy already exists.

**Abstract Factory** — creates families of related products through one interface.
*Earns it:* the products must be mutually compatible, and picking one member of the wrong family is a real bug; or a class has accumulated factory methods that blur its primary job.
*Costs:* a lot of interfaces and classes. Do not reach for it when there is exactly one family.

**Builder** — constructs an object step by step, exposing only finished results.
*Earns it:* a telescopic constructor; several representations built by the same step sequence; recursive construction of trees.
*Costs:* an extra class per representation. Distinguish from Abstract Factory: a factory returns the product immediately; a builder lets you run further steps first.

**Prototype (Clone)** — copies existing objects without depending on their classes.
*Earns it:* objects arrive from third-party code behind an interface; or subclasses exist only to encode different initial configurations.
*Costs:* circular references make cloning genuinely hard.

**Singleton** — one instance, globally reachable.
*Earns it:* almost never in a DI codebase. A container-registered singleton lifetime gives you the single instance without the global access point, and keeps the dependency visible in the constructor.
*Costs:* it violates SRP by design (one instance **and** global access), masks components knowing too much about each other, needs explicit thread-safety, and is hard to mock — most mocking frameworks need inheritance, and the constructor is private. Treat a hand-rolled Singleton in a diff as a finding.

### Structural

**Adapter** — translates one interface into another.
*Earns it:* an existing class you can't change (legacy, vendor, protocol) doesn't fit the caller.
*Costs:* extra layer. If you own the callee, changing it is often simpler and honest.

**Bridge** — splits abstraction from implementation into two hierarchies that vary independently.
*Earns it:* two genuinely orthogonal dimensions; or you must swap the implementation at runtime.
*Costs:* over-applied to a cohesive class, it just adds indirection. Bridge is designed up front; Adapter is retrofitted.

**Composite (Object Tree)** — leaves and containers share one interface, so clients treat them uniformly.
*Earns it:* the domain structure is actually a tree, and client code currently branches on node kind.
*Costs:* forcing a common interface over classes that differ too much produces an over-generalised, incomprehensible component interface.

**Decorator** — wraps an object to add behaviour, keeping its interface.
*Earns it:* behaviours must be attached at runtime, in combinations; or the class is `sealed`/`final` and can't be subclassed.
*Costs:* removing one wrapper from a stack is hard, order-dependence creeps in, and the assembly code gets ugly. Interface comparison: **Adapter** gives a *different* interface, **Proxy** the *same*, **Decorator** an *enhanced* one.

**Facade** — one simple entry point into a complicated subsystem.
*Earns it:* clients need a narrow slice of a subsystem, or you want layer-to-layer communication to go through one door.
*Costs:* facades grow into God Objects coupled to everything. Watch this in review.

**Flyweight** — shares immutable intrinsic state across many objects.
*Earns it:* a huge number of similar objects genuinely exhausts RAM, and duplicate state is extractable. All three conditions, measured.
*Costs:* trades RAM for CPU, and every new team member will ask why the entity is split in two.

**Proxy** — a stand-in with the same interface that controls access to the real object.
*Earns it:* lazy init, access control, remoting, logging, caching, or smart-reference lifetime management.
*Costs:* more classes, and a latency hop. Differs from Decorator by intent: a Proxy usually manages its service object's lifecycle; a Decorator's composition is controlled by the client.

### Behavioral

**Chain of Responsibility** — a request travels a chain until a handler takes it.
*Earns it:* request kinds and order aren't known up front, or the handler set changes at runtime.
*Costs:* a request can fall off the end unhandled — that path needs an explicit decision.

**Command** — a request as an object carrying its own parameters.
*Earns it:* you need to parameterise objects with operations, queue/schedule/serialise them, or implement undo.
*Costs:* a whole new layer between senders and receivers. For undo, pair with Memento (snapshot) or implement an inverse operation (cheaper in RAM, sometimes impossible).

**Iterator** — traversal extracted from the collection.
*Earns it:* the structure is complex and should stay hidden; or traversal code is duplicated across the app.
*Costs:* overkill for simple collections, and slower than direct access on specialised ones. Most modern languages already provide this — don't hand-roll.

**Mediator (Intermediary)** — components talk through one object instead of to each other.
*Earns it:* a component can't be changed or reused because it knows too many siblings.
*Costs:* the mediator collects everything and becomes a God Object. Contrast with Facade: a subsystem is *unaware* of its facade and its parts may still talk directly; mediator components know *only* the mediator.

**Memento** — snapshot of state that doesn't break encapsulation.
*Earns it:* undo, or transactional rollback on error, where exposing fields would leak internals.
*Costs:* RAM if snapshots are frequent; the caretaker must track the originator's lifecycle.

**Observer (Event-Subscriber, Listener)** — subscribers register for notifications.
*Earns it:* the reacting set is unknown up front or changes at runtime.
*Costs:* notification order is not guaranteed — any code that depends on subscriber ordering is a bug waiting.

**State** — state-specific behaviour extracted into one class per state.
*Earns it:* many states, state-specific code changing often, and a class already polluted with conditionals on its own status field.
*Costs:* overkill for a few stable states. Related to Strategy, but State objects are allowed to know each other and to drive the context's transitions; Strategies are mutually unaware.

**Strategy** — interchangeable algorithms behind one interface.
*Earns it:* a massive conditional switching between variants of the same algorithm; runtime swapping; several near-identical classes differing only in one behaviour.
*Costs:* with two rarely-changing algorithms it is pure overhead. In a language with first-class functions, a delegate/lambda gives the same swap without the class and interface — prefer that.

**Template Method** — a fixed algorithm skeleton with overridable steps.
*Earns it:* several classes run nearly the same algorithm, differing in a few steps, and the whole structure must stay fixed.
*Costs:* inheritance-based, so it is static — no runtime swap. Suppressing a default step in a subclass can violate LSP. Maintenance cost grows with step count. Strategy is the composition-based alternative.

**Visitor** — an operation defined outside the classes it operates on.
*Earns it:* an auxiliary behaviour must run across a whole heterogeneous structure and doesn't belong in the element classes.
*Costs:* the big one — **every new element type forces a change to every visitor**, which is Shotgun Surgery by construction. Also, visitors often can't reach the private state they need.

---

## Confusion pairs — get these right in review

- **Adapter / Decorator / Proxy** — different interface / enhanced interface / same interface.
- **Adapter / Facade** — one object vs. an entire subsystem; making an existing interface usable vs. defining a new one.
- **Facade / Mediator** — the subsystem doesn't know its facade and can bypass it; mediator components know nothing *but* the mediator.
- **Bridge / Strategy** — near-identical structure, different intent. Bridge is a planned split across orthogonal dimensions; Strategy is interchangeable algorithms. The name communicates which problem you were solving.
- **State / Strategy** — State is Strategy where the objects know each other and can drive transitions.
- **Strategy / Template Method** — composition (runtime, object level) vs. inheritance (compile time, class level).
- **Command / Strategy** — "turn an operation into an object" vs. "different ways of doing the same thing".
- **Composite / Decorator** — same recursive shape; a Decorator has exactly one child and adds responsibility, a Composite has many and sums their results.
- **Singleton / Flyweight** — one mutable instance vs. many immutable instances with different intrinsic state.
- **Factory Method / Template Method** — Factory Method is a specialisation of Template Method, and may also be one step inside a larger one.

---

## Anti-triggers — when the pattern is the problem

Flag these in review with the same weight as a missing pattern:

- **A factory or Strategy interface with exactly one implementation and no architectural boundary crossed.** `clean-code.md` is explicit: do not introduce an abstraction to satisfy a single caller — wait for the second. Depending on interfaces across layers does not license an interface per class inside one.
- **An abstraction introduced for a requirement that does not exist.** Speculative Generality — delete and inline back.
- **A pattern name in a class name that the class doesn't earn** (`XFactory` that news up one type, `YStrategy` chosen by a hard-coded constant, `ZManager` that does everything).
- **A hand-rolled Singleton in a codebase with a DI container.**
- **A Facade or Mediator that has grown into a God Object** — coupled to everything, changed for every feature.
- **Visitor over a hierarchy that is still growing** — you have bought Shotgun Surgery forever.
- **A pattern applied to code that has changed once.** Duplication becomes a pattern candidate at the second real occurrence, not the first.

---

## Provenance

Distilled in original wording from Alexander Shvets, *Dive Into Design Patterns* (Refactoring.Guru, 2021) — chapters "Software Design Principles" and "Catalog of Design Patterns" — plus the GoF pattern set it documents. The applicability triggers, cost lines, and confusion pairs follow that book's framing; the anti-trigger list and the symptom table are ours.
