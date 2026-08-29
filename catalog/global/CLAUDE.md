# Claude Code — Global Preferences

## Clean Code

- Names must reveal intent without needing a comment, scale in length with their scope, and stay free of encodings (Hungarian notation, type/scope prefixes) — a name you can't state clearly means you haven't understood the thing yet.
- Functions must be small, do exactly one thing at one level of abstraction, take as few arguments as possible (never a boolean flag), avoid output arguments, and carry no hidden side effects — either do something or answer something, never both.
- Prefer no comment over any comment: express intent in code, not prose; never comment bad code — rewrite it; delete stale, redundant, or commented-out code the moment you see it, rather than leaving it to rot.
- Eliminate duplication (DRY) and dead code on sight; leave every file a little cleaner than you found it (Boy Scout Rule), refactoring in small, test-covered steps rather than big-bang rewrites — "later equals never."
- Handle errors with exceptions carrying real context, never return or accept `null`, and keep error-handling logic fully separated from the algorithm it protects.
- Objects and data structures are opposites — objects hide data behind behavior, data structures expose data with no behavior; never build a hybrid, and never chain calls through an object you don't own (Law of Demeter).
- Classes must be small and cohesive with a single reason to change (SRP), open for extension but closed for modification (OCP), and depend on abstractions rather than concretions (DIP); wrap any third-party/boundary API behind your own narrow interface.
- Write or expect tests alongside the code they verify, hold test code to the same quality bar as production code, and prefer polymorphism over switch/if-else chains, named constants over magic numbers, and explicit dependencies over implicit ordering.

## Personal Preferences

- Be extremely concise. Sacrifice grammar when it improves brevity. Skip obvious explanations; assume I know the language and standard programming concepts.
- Keep conversations, explanations, and non-shared documents in Serbian, preserving common technical terms in English. Write all shared artifacts (PRDs, RFCs, ADRs, specs, MRs, etc.) in English.
- Always show the full file path in code references (`src/Api/Endpoints/OrdersEndpoint.cs:42`)
- When suggesting refactors, explain the trade-off, not just the benefit
- I work on macOS (Rider IDE), run WSL when on Windows — use Unix commands in Bash
- Never add XML doc comments, docstrings, or inline comments unless the logic is non-obvious
- Do not add error handling for scenarios that cannot happen — trust the framework

## Reference Index

These are **not** auto-loaded — read the relevant file(s) from `~/.claude/docs/` when the task matches.

| Doc file | When it applies |
| --- | --- |
| `docs/architecture.md` | Any C# file — layer boundaries, project layout, DI wiring, key patterns |
| `docs/coding-standards.md` | Any C# file — naming, style, formatting, logging, what to avoid |
| `docs/ef-core.md` | LINQ queries, repositories, entity configs, migrations |
| `docs/api-guidelines.md` | Controllers, endpoints, request/response types, auth, resource design |
| `docs/testing-strategy.md` | Any test file or test project |
| `docs/security.md` | Auth, secrets, input validation, sensitive data |
| `docs/git-workflow.md` | Branches, commits, merge checklist |
| `docs/clean-code.md` | Any code change — full Clean Code reference: naming, functions, comments, formatting, error handling, classes, YAGNI/KISS/DRY/SRP, smells & heuristics |
| `docs/design-patterns.md` | Designing a module, choosing where behaviour lives, reviewing new abstractions |
| `docs/react-conventions.md` | Creating or modifying React components, hooks, or frontend build config |
| `docs/deployment.md` | Environments, deploy process, rollback |

## Tool Preferences

- Use `Read` not `cat` / `head` / `tail`
- Use `Grep` not `rg` / `grep`
- Use `Edit` not `sed` / `awk`
- Reserve `Bash` for commands that require shell execution
