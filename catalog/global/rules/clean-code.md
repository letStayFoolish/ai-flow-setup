# Clean Code Principles

Applies when: writing, modifying, or reviewing any code.

## YAGNI — You Aren't Gonna Need It

Only write code that is required by the current task. Do not add:
- Parameters, fields, or flags for features not yet requested
- Extension points or plugin hooks for hypothetical consumers
- Generic versions of logic that is only needed in one specific form
- Configuration options for behaviour that never varies

If a requirement does not exist today, the code for it does not exist today.

## KISS — Keep It Simple

Prefer the simplest solution that correctly solves the problem. Complexity must justify itself.

- A flat `if/else` beats a strategy pattern for two cases
- A direct method call beats an event/message bus for same-process logic
- A single class beats a class hierarchy when there is only one variant
- Standard library types beat custom abstractions when they fit

When you find yourself writing something clever, stop and ask whether a future reader would understand it in 30 seconds. If not, make it boring.

## SRP — Single Responsibility

Every class and every method should have one reason to change.

- A method that fetches data and formats it for display has two responsibilities — split it
- A service that handles business logic and sends emails has two responsibilities — split it
- A class whose name contains "And" or "Manager" is a warning sign

Small, focused units are easier to test, easier to name, and easier to change independently.

## DRY — Don't Repeat Yourself

Eliminate duplication — but only when the abstraction costs less than the duplication.

- Two similar lines: leave them alone
- Three identical blocks: extract a shared function or method
- Do not extract prematurely; wait until the third repetition makes the pattern obvious
- Do not DRY things that are coincidentally similar — shared logic that diverges later is worse than duplication now

## Coupling and Cohesion

Components should be easy to change in isolation.

- **Low coupling**: a component should know as little as possible about the internals of others. Depend on interfaces, not concretions. Pass what is needed, not the whole object.
- **High cohesion**: things that change together belong together. If two classes always change at the same time, they probably belong in the same unit. If a class has methods that never interact, it should be split.
- Avoid reaching across layer boundaries — `Api` does not touch `Infrastructure`, `Domain` has zero external dependencies.

## The Three Principles Underneath

Reach for these when the rules above feel abstract — most design patterns are one of the three applied to a specific shape of problem.

- **Encapsulate what varies** — separate the parts that change for their own reasons from the parts that stay still. Start by extracting a method; escalate to a class only once the extracted logic grows its own fields and helpers.
- **Program to an interface, not an implementation** — derive the interface from what the caller actually needs, not from everything the callee can do. Be honest about the trade: extracting an interface makes the code more complicated *immediately* and more useful only *later*. That is why the DRY and YAGNI rules above gate it.
- **Favour composition over inheritance** — inheritance is the cheapest reuse and the most expensive coupling. A subclass cannot narrow its parent's interface, overrides must stay behaviour-compatible, and reuse across two independent axes multiplies subclasses. The moment you extend along a second axis, stop and compose.

## Choosing a Structure

Once the rules above establish that structure *is* needed — and only then — [design-patterns.md](design-patterns.md) covers *which*: a symptom→pattern table, the 22 GoF patterns with their real costs, the confusion pairs (Adapter/Decorator/Proxy, Bridge/Strategy, State/Strategy), and the anti-triggers that mark a pattern as over-applied.

It is subordinate to YAGNI: it names patterns for pain already visible in the code, never for anticipated pain.

## What NOT to do

- Do not introduce an abstraction to satisfy a single caller — wait for the second
- Do not create base classes, generics, or interfaces "for future extensibility"
- Do not add method overloads, optional parameters, or flags to handle cases that do not yet exist
- Do not wrap a framework type in your own type unless the wrapper adds meaningful behaviour
- Do not split code into more files, classes, or methods than the complexity warrants
