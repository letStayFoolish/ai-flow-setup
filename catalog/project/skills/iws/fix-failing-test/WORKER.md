# Fix Failing Test — Worker

You own one test class's failures, handed to you as a CI excerpt. Root-cause and fix each failing method, test-side, then prove the whole class green. You end by returning a report; there is no developer in your loop.

## Step 1 — Identify

For each failing method, extract:

- Fully qualified method: `Namespace.Class.Method`
- The first stack frame inside the repo (skip `System.*` / `Microsoft.*` frames) → file path + line number
- The failure-history line, if present

Map the root namespace to its project and `.develop-ci.yml` job:

| Root namespace | Project | CI job |
|---|---|---|
| `ControllerTests` | `IwsServer/ControllerTests/ControllerTests.csproj` | controller-tests |
| `CustomUnitTests` | `IwsServer/CustomUnitTests/CustomUnitTests.csproj` | unit-tests |
| `DataSocketProcessorTest` | `IwsServer/DataSocketProcessorTest/DataSocketProcessorTest.csproj` | dataSocket-tests |
| `IWSPersistanceEF.Test` | `IwsServer/IWSPersistanceEF.Test/IWSPersistanceEF.Test.csproj` | persistance-tests |
| `IwsServicesTest` | `IwsServer/IwsServicesTest/IwsServicesTest.csproj` | service-tests |

Run Steps 2–4 for each method in turn, then Step 5 once for the class.

## Step 2 — Reproduce

```bash
dotnet test <csproj> --filter "FullyQualifiedName=<Namespace.Class.Method>"
```

If it fails locally the same way, continue to Step 3. If it passes locally, this is **flaky**, not broken: a high failure count on `develop` with a local pass means the cause is state/order/environment, not logic. Look for shared fixture state, time/culture dependency, or an ordering assumption across DB/Kafka/Redis, then go to Step 3 to pin down which one.

## Step 3 — Root-cause

Read the test and whatever it drives (fixture setup, mocks, the production method it calls). Trace the actual value that trips the assertion back to where it diverges from what the test expects — a concrete causal chain, not a guess. If the chain isn't obvious from reading, reach for the `diagnosing-bugs` skill's hypothesize-and-instrument loop instead of staring longer.

## Step 4 — Place the fix

Default, and the outcome to reach for every time: the test is wrong — stale expected value, brittle mock, bad fixture data, an assumption the production code never promised. Fix it in the test file alone.

Only when Step 3's causal chain ends inside production code, with the test's expectation matching the documented/intended behavior, is this a production bug — rare. Then leave production code untouched, mark the method `production-bug`, and record for the report:

- the assertion that fails and the concrete root cause in production code
- the exact behavior change a fix would introduce

## Step 5 — Verify the whole class

For each method you fixed, then for the class:

```bash
dotnet test <csproj> --filter "FullyQualifiedName=<Namespace.Class.Method>"
dotnet test <csproj> --filter "FullyQualifiedName~<Namespace.Class>"
```

Done when every fixed method and the class run are green, with only `production-bug` methods still red. A fixed test next to a sibling you broke is not done — the class run is what catches that.

## Report

Return, per method: outcome (`fixed` / `production-bug` / `unresolved`), the causal chain in one or two lines, files changed. For `production-bug`, include the two items from Step 4. For `unresolved`, what you ruled out and where the chain went cold. End with the class-run result.
