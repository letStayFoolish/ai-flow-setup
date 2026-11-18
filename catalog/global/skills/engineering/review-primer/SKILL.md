---
name: review-primer
description: Short human-readable primer on a finished change — the gist, the key idea, and a reading order — to read before walking the MR code yourself.
disable-model-invocation: true
argument-hint: "[MR link | git ref] — default: merge-base with the default branch"
---

# Review primer

A **primer** is the map read before the territory. The reader will go through every line of the MR right after this; the primer hands them the *why* and the *shape* first, so the code reads as confirmation instead of a puzzle. The review already gave its verdict; the primer orients and judges nothing.

Narrative in Serbian. Code, identifiers, paths and pattern names stay in English. Every code reference is a full repo path with a line: `IwsServer/IwsCore/Foo.cs:42`.

## 1. Resolve the change

- No argument → `BASE=$(git merge-base <default branch> HEAD)`, diff `git diff --find-renames "$BASE"` (includes uncommitted work).
- A git ref → it replaces `$BASE`; check it with `git rev-parse`.
- A GitLab MR link → with `API=https://<host>/api/v4/projects/<url-encoded project path>` and `GITLAB_TOKEN`:
  ```bash
  curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$API/merge_requests/$MR_ID" | jq '{title, description, source_branch}'
  curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "$API/merge_requests/$MR_ID/versions" | jq -r '.[0].base_commit_sha'   # $BASE
  git fetch origin "$SOURCE_BRANCH"
  ```
- A GitHub PR link → `gh pr view "$PR" --json title,body,baseRefName,headRefName`, then `git fetch` the head and take `$BASE` as its merge-base with the base branch.

**Done when:** `$BASE` resolves and you hold the list of changed files.

## 2. Find the intent

Read, in order, whichever exist: the MR description, a spec/PRD under `docs/` matching the branch or ticket key, the Jira ticket (Atlassian MCP, key from the branch name or description), and the review findings already in this conversation or on the MR.

**Done when:** you can state the problem the change solves in one sentence, citing its source — or you record "nema spec-a" and derive the intent from the code alone, saying so in the primer.

## 3. Read the whole diff

Read every hunk, and open surrounding code wherever a hunk alone does not explain the flow (callers, the entry point, the type being changed). Sort each changed file into one of two roles:

- **logic** — changes behaviour, or carries the tests that pin it;
- **noise** — rename, move, formatting, DI/config wiring, generated or lock files.

A file you have not read is not sorted. Behaviour hidden in a noisy-looking file goes to logic.

**Done when:** every changed file sits in exactly one role.

## 4. Write the primer

Fill this template. Budget: about 40 lines, the sketch excluded. When it runs over, cut prose, never files.

```markdown
# <ticket key>: <naslov>

**Suština** — 2–3 rečenice: koji problem, kako je rešen, šta se menja za korisnika ili sistem.

**Ključna ideja** — jedna odluka posle koje kod ima smisla (npr. "guard se postavlja pri type init-u, pa…"). Ako se iz spec-a ili koda vidi, i zašto ne očigledna alternativa.

**Tok** — skica u ```diff bloku (`+`/`-`): call-tree, ili pre/posle kad se ponašanje promenilo.

**Redosled čitanja**
1. `path/File.cs:42` — šta ovde tražiš, jedan red
2. …
(počni od ulazne tačke ili srži promene; testovi idu tamo gde potvrđuju ponašanje)

**Šum** — fajlovi koje je dovoljno preleteti, jedan red za sve: `a.cs`, `b.csproj` (rename/wiring/format).

**Nije očigledno iz koda** — najviše 3 mesta gde namera nije vidljiva: skriven trade-off, implicitna pretpostavka, otvoren review nalaz. Svako sa `path:line`.
```

**Done when:** every logic file appears in *Redosled čitanja*, every noise file in *Šum*, every reference carries `path:line`, and the length is within budget.

## 5. Deliver

Print the primer in the chat and save it to `.scratch/primers/<ticket-or-short-sha>.md`.

**Done when:** the primer is in the chat and the saved path is given in full.
