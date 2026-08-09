# Contributing

This repo has two parts:

- `catalog/` — the actual content that gets installed (source of truth,
  hand-edited).
- `src/generated/catalog.json` — a generated manifest listing every catalog
  file with its scope/type/destination. **Never edit this by hand.**

## Layout

Nothing below is new except the two lines marked `(new)` — everything else in
`catalog/` is unchanged.

```
catalog/
├── global/                             → installs under ~/.claude/
│   └── skills/
│       ├── dotnet/<name>/SKILL.md      (new) organizational category, .NET-specific
│       └── engineering/<name>/SKILL.md (new) organizational category, general dev workflow
└── project/                             → installs into the target project root
    └── skills/
        └── iws/<name>/SKILL.md         (new) installs into ./.claude/skills/<name>/,
                                               not ~/.claude — only meant for whichever
                                               project you run the CLI in
```

The destination path is derived from the file's path relative to its scope
folder — e.g. `catalog/global/rules/foo.md` → `~/.claude/rules/foo.md`,
`catalog/project/CLAUDE.md` → `./CLAUDE.md`.

**Skills are the exception.** Category folders under `skills/` (`dotnet/`,
`engineering/`, `iws/`, or any new one) exist purely to keep the source tree
browsable — the build script finds each skill's root by locating the nearest
ancestor directory containing `SKILL.md`, and flattens the category out of
the install path. So `catalog/global/skills/dotnet/review-dotnet/SKILL.md`
still installs to `~/.claude/skills/review-dotnet/SKILL.md`, not
`~/.claude/skills/dotnet/review-dotnet/SKILL.md`. A skill can live directly
under `skills/` with no category at all — both are valid.

**Scope decides where a skill installs, not the category.** A skill under
`catalog/global/skills/...` (in any category) installs machine-wide, with the
user choosing copy/symlink/project-local at install time. A skill under
`catalog/project/skills/...` always installs into `./.claude/skills/<name>/`
of whatever project the CLI is run in — no install-mode prompt. Use `project`
scope for anything that only makes sense inside one specific repo (e.g.
company-internal review skills tied to that repo's own conventions).

## Add a `.md` file (rule, doc, command)

1. Drop it under `catalog/global/<rules|commands>/` or `catalog/project/`.
2. Run `npm run catalog:build`.
3. Commit both the new file and the updated `src/generated/catalog.json`.

## Add a skill

1. Create `<skill-name>/SKILL.md` (plus any supporting files, same layout it
   has in `~/.claude/skills/<name>/`) under:
   - `catalog/global/skills/` (optionally inside a category folder like
     `dotnet/` or `engineering/`) for a machine-wide skill, or
   - `catalog/project/skills/` (optionally inside a category folder like
     `iws/`) for a skill that only belongs in one specific project.
2. Run `npm run catalog:build`.
3. Bump `version` in `package.json` (patch is fine for a single skill
   add/update). It's the only version tag this repo has — shown in
   `ai-flow-setup --version` and in the CLI's install-time note — so it must
   move whenever the catalog changes, even without a code change.
4. Commit the new folder, the updated manifest, and the version bump.

### Adding a reused (non-original) skill

If the skill is copied or adapted from an external source (e.g. another
skills marketplace/repo), it is **not** to be presented as original work:

1. Add an `ATTRIBUTION.md` inside the skill's folder — source URL, license,
   and whether it was reused as-is or modified.
2. Add a row for it to the table in the root [`ATTRIBUTION.md`](./ATTRIBUTION.md).
3. If the source has its own license file and it differs from this repo's
   MIT license, copy it alongside (see
   `catalog/global/skills/UPSTREAM-LICENSE-mattpocock-skills.txt` for the
   pattern) and keep it in sync with the source.

`ATTRIBUTION.md` files are excluded from the generated manifest — they are
metadata for humans, not something that gets installed.

## Remove a file or skill

1. Delete it from `catalog/`.
2. Run `npm run catalog:build`.
3. Commit the removal and the updated manifest. This does **not** remove the
   file from machines that already installed it — `ai-flow-setup` only adds
   or merges, it never deletes on the user's behalf.

## Update an existing file or skill

1. Edit it in place under `catalog/`.
2. Run `npm run catalog:build` (updates nothing structural unless the path
   changed, but keep the habit — it's the single source of truth check).
3. Commit. Users who re-run `ai-flow-setup` will see a diff prompt for any
   destination file that already differs from the new version.

## `catalog:build` workflow

```bash
npm run catalog:build   # scans catalog/, writes src/generated/catalog.json
npm run build            # tsc compile + copies the manifest into dist/
npm run dev               # run the CLI against source (tsx, no build step)
```

Always run `catalog:build` after touching anything under `catalog/`, before
building or testing the CLI — `src/cli.ts` reads the generated manifest, not
the filesystem directly.

## Testing locally

```bash
npm install
npm run catalog:build
npm run dev
```

Or, to test it the way an end user would (via `npx`):

```bash
npm run build
npm pack
npx ./ai-flow-setup-<version>.tgz
```

## Commit conventions

Follow the standard `type: short imperative description` format (`feat`,
`fix`, `chore`, `docs`, `refactor`). Always stage `src/generated/catalog.json`
together with the `catalog/` change that produced it — a catalog change
without a rebuilt manifest is an incomplete commit.
