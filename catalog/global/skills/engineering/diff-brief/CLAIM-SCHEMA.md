# The claim

The only thing the two authoring agents write. `claims` is an array of these; nothing else is authored by a model.

```json
{
  "id": "a3f1c2",
  "type": "delta",
  "order": 1,
  "text": "Before: cancellation succeeded in any status. Now: OrderService.Cancel throws InvalidOperationException unless status is Pending.",
  "anchors": [{ "path": "src/Domain/OrderService.cs", "symbol": "Cancel", "lines": [88, 96] }],
  "hunks": ["src/Domain/OrderService.cs@@-84,6+84,14"]
}
```

| field | written by | values |
|---|---|---|
| `id` | author | `hash(path + symbol + type)`, first 6 hex |
| `type` | author | `delta` `flow` `coverage` `question` `merge-danger` `manual-check` `cosmetic` `unplaced` |
| `order` | author | integer, reading order within its type |
| `text` | author | one Level-2 claim, see below. **English**, always |
| `anchors` | author | `path`, `symbol`, `lines: [from, to]`; `code` is filled by the hydrate step |
| `hunks` | author | hunk ids from the inventory; `patch` is filled by the hydrate step |
| `verdict` | skill | only ever `rejected`, set by hydration when an anchor does not resolve (+ `reason`) |
| `deltaRef` | author | on `coverage` and `manual-check` only: the `id` of the `delta` it belongs to |

**`id` is derived from the anchor, never from the text.** A symbol survives line shifts; a sentence does not survive a re-run of the same model.

**`text` is English even though the chat is Serbian.** The markdown projection goes onto an MR where the team and future readers need English; the HTML projection renders this same English text under Serbian section headings. There is no translation pass — a second model call per run buys nothing but drift.

## Types

| type | section | who writes it |
|---|---|---|
| `delta` | Delta ponašanja | Navigator — **the spine**, 3–7 of them |
| `flow` | Kako teče | Navigator — one claim, the smallest view that carries the point |
| `coverage` | Pokrivenost | Navigator — one per delta, covered or not |
| `merge-danger` | Merge Danger | Navigator — exactly one |
| `manual-check` | Proveri ručno | Navigator — 3–5, HTML only |
| `question` | Pitanja | Challenger — never a verdict |
| `cosmetic` | collapsed | skill, from git |
| `unplaced` | Nisam utvrdio | Navigator — a hunk it could not place |

## Rules on content

**Anchoring.** Every sentence carries an anchor to specific lines, and the document renders those lines beside it. A claim you cannot anchor is a claim you do not write. The one exception is `flow`, whose text is a structural sketch rather than a sentence about one site.

**Level 2 only.** A claim states a *behaviour delta* — it joins several sites, or it states a before/after difference.

- GOOD: "Before: X. Now: Y."
- BAD: "A method `CancelOrder` was added that takes `orderId`." — that is the diff, longer and less reliable.
- BAD: "This was done because…" — rationale is allowed only as a quote from the spec.
- **The test: if a sentence can be derived from one hunk alone, delete it.**

**Unambiguity is enforced, not requested.**

1. The words *maybe, probably, should, generally, appears to* are banned. Not knowing is a legitimate output: write `"not determined"`.
2. Every behavioural claim takes the **Before → After** form. No exceptions.
3. The subject of every sentence is a concrete code entity — a type, method, endpoint, table. Not "the system", not "the logic".

**Report absence as absence.** "I did not find X" — never "X is clean". The agent that wrote the code cannot clear it.

**Nothing is deleted, only collapsed.** Top-N is a display decision. The one exception is a claim whose anchor failed to hydrate: it moves into the visible **Odbačeno** section carrying its original text and the reason. That section is the only trust metric this tool offers, because there is no Verifier pass.
