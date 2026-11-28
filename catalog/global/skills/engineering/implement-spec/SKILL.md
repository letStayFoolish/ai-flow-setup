---
name: implement-spec
description: "Implement the result of /to-spec and /to-tickets in code."
disable-model-invocation: true
---

You have been provided a spec. This spec should have tickets associated with it, describing how to implement the spec.

The issue tracker should have been provided to you. If not, tell the user to run `/setup-agent-skills`.

The goal is the entire spec implemented on a single **integration branch**, with every ticket resolved the way the issue tracker closes work.

The tickets are not a list of steps. They are a **task graph** with blocking relationships between them. This means there is always a **frontier** of tickets which are ready to be grabbed.

Communication to and from subagents should be sparse. Communicate primarily through **context pointers**: to the spec, tickets, research notes, and previous commits. Don't duplicate information already available via pointers.

**Implementer subagents** should be run in the background where possible for maximum concurrency.

## Steps

1. Read the spec and tickets to understand the task graph. Each ticket carries `Schema: yes|no` (set by `to-tickets`). Schema tickets never run concurrently: if two `Schema: yes` tickets have no blocking path between them, add a `blocked by` edge in the ticket file (commit it) before dispatching either. A ticket missing the field → infer it from the ticket (migration, entity, table or column change) and write it in.

2. (optional) Use an **exploration subagent** to conduct any exploration required by the tickets - relevant codebase files or external documentation. Ensure the exploration subagent can save files - it should save its markdown notes in a directory outside the repo, accessible by all future subagents. This lets **implementer subagents** focus on implementation rather than exploration.

3. Create the integration branch. If the issue tracker closes work through PRs, or the user asks for one, open a draft PR after the first merge in step 5 (a branch with no commits ahead of main can't open one), marked as closing the spec and tickets.

4. Use **implementer subagents** (`subagent_type: implementer`) to implement each ticket, each in its own worktree on its own branch. Pass only pointers: ticket, spec, integration branch, worktree path, exploration notes dir. The `implementer` agent definition owns the per-ticket protocol: rebase onto the integration branch, `tdd`, merge the integration tip, commit.

   No `implementer` agent type on this machine → dispatch `general-purpose` with the same pointers plus this protocol in the prompt:
   - confirm the worktree is based on the integration branch; reset onto it if not;
   - call the Skill tool with `tdd` to build the ticket; an implementation-detail ambiguity → decide and append it under `Assumptions:` in the ticket file;
   - merge the integration branch tip, run the repo's verify command until green, commit with the ticket's `Assumptions:`;
   - report branch + sha, each acceptance criterion with its test (or `no red run: <reason>`), test counts, blockers.

   Commit each ticket file to the integration branch before dispatching its implementer, so the worktree starts from the tracked ticket and the implementer's `Assumptions:` merge back cleanly.

5. Once an **implementer subagent** completes, merge its work to the integration branch with a **merger subagent**. The merger runs the repo's verify command on the integration tip after the merge; red → it fixes the integration break itself (no new feature code) before any new implementer is dispatched. After a `Schema: yes` merge it also checks the migration chain is linear (EF Core: one new migration per schema ticket, `dotnet ef migrations has-pending-model-changes` reports none).

6. If this changes the **frontier** of available tickets, kick off more **implementer subagents** to work on the new tickets. This allows for maximum concurrency.

7. **Integration gate** — once all tickets are merged, on the integration tip, in order. Each step must pass before the next:
   1. The full verify command (build, lint, every test project, not only the touched ones).
   2. Schema changed → apply every new migration to a disposable local database (a fresh container, never a shared DB), then roll back to the pre-Line migration and apply again. Report the generated SQL script path.
   3. Call the Skill tool with `code-review` on the integration branch, passing the **spec** as the originating spec, so the Spec axis judges the whole Line rather than one ticket.
   4. Dispatch the `qa` agent on the integration tip with the spec's acceptance criteria. It is a pre-check, not the developer's QA Human Gate.

   Fix code-review findings and QA `code bug` findings in a single **implementer subagent**, then rerun the gate from 7.1. At most two fix rounds; still failing → stop the Line and report what fails. A QA `spec gap` or a contradiction with the spec → stop the Line and report it; don't fix it.

8. Save the QA pre-check table to `~/.claude/lines/<branch>/qa-precheck.md` (branch name with `/` → `-`), where `pr` picks it up for the Review Guide. If a draft PR exists (step 3), call the Skill tool with `pr` to replace its description, then mark it ready for review. Otherwise resolve each ticket the way the issue tracker closes work, and report the integration branch, the QA pre-check table, and that the branch is ready for the developer's `/pr`.

9. Clean up all **implementer subagent** worktrees.

10. Append one row to `~/.claude/factory-log.md` (create it with the header from `~/.claude/docs/software-factory.md` if missing): the spec, code-review and QA pre-check findings with the Station that should have caught each, fix rounds used, `MR returned` left blank for the developer.
