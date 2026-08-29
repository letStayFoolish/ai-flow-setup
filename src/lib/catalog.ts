import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { CatalogEntry } from "./types.js";
import { skillNameFromDestPath } from "./paths.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// package root: dist/lib/catalog.js -> dist/lib -> dist -> <package root>
export const packageRoot = join(__dirname, "..", "..");

export type { CatalogEntry } from "./types.js";

// package.json's version is the single version tag for both the CLI and the
// catalog snapshot it ships — bump it whenever a skill is added or updated
// (see CONTRIBUTING.md) so `--version` and the install-time note stay accurate.
export function packageVersion(): string {
  const pkg = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf-8")) as { version: string };
  return pkg.version;
}

export function loadCatalog(): CatalogEntry[] {
  const catalogPath = join(__dirname, "..", "generated", "catalog.json");
  const raw = readFileSync(catalogPath, "utf-8");
  return JSON.parse(raw) as CatalogEntry[];
}

export function groupBySkill(entries: CatalogEntry[]): Map<string, CatalogEntry[]> {
  const groups = new Map<string, CatalogEntry[]>();
  for (const entry of entries) {
    const key = entry.type === "skill" ? `skill:${skillNameFromDestPath(entry.destPath)}` : entry.id;
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }
  return groups;
}

// Short, human-typed form of a group key: the bare skill name for skills
// ("code-review"), or the destination filename without extension for
// rules/docs ("api-conventions"). Not guaranteed unique across the catalog.
function shortName(key: string, group: CatalogEntry[]): string {
  if (key.startsWith("skill:")) return key.slice("skill:".length).toLowerCase();
  const basename = group[0].destPath.split("/").pop() ?? key;
  return basename.replace(/\.md$/, "").toLowerCase();
}

export type NameResolution = {
  matched: CatalogEntry[];
  unmatched: string[];
  ambiguous: { name: string; candidates: string[] }[];
};

// Resolves user-typed names (from CLI args) against the catalog, so
// `ai-flow-setup code-review` can install a skill directly without the
// interactive multiselect. Accepts either a group's full key (its id, or
// `skill:<name>`) or its short form; short forms that collide across groups
// (e.g. "CLAUDE.md" exists at both global and project scope) are reported
// as ambiguous rather than silently picking one.
export function resolveNames(entries: CatalogEntry[], names: string[]): NameResolution {
  const groups = groupBySkill(entries);
  const shortToKeys = new Map<string, string[]>();
  for (const key of groups.keys()) {
    const short = shortName(key, groups.get(key)!);
    const keys = shortToKeys.get(short) ?? [];
    keys.push(key);
    shortToKeys.set(short, keys);
  }

  const matched: CatalogEntry[] = [];
  const unmatched: string[] = [];
  const ambiguous: NameResolution["ambiguous"] = [];

  for (const name of names) {
    const direct = groups.get(name) ?? groups.get(`skill:${name}`);
    if (direct) {
      matched.push(...direct);
      continue;
    }
    const keys = shortToKeys.get(name.toLowerCase());
    if (!keys) {
      unmatched.push(name);
    } else if (keys.length > 1) {
      ambiguous.push({ name, candidates: keys });
    } else {
      matched.push(...groups.get(keys[0])!);
    }
  }

  return { matched, unmatched, ambiguous };
}
