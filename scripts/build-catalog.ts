import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type { CatalogEntry } from "../src/lib/types.js";
import { globalDestPath, globalSkillDestPath, projectDestPath, projectSkillDestPath } from "../src/lib/paths.js";

const CATALOG_ROOT = join(process.cwd(), "catalog");
const OUT_FILE = join(process.cwd(), "src", "generated", "catalog.json");

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

function classify(relPath: string): CatalogEntry["type"] {
  if (relPath.startsWith("skills/")) return "skill";
  if (relPath.startsWith("rules/")) return "rule";
  if (relPath.startsWith("commands/")) return "command";
  return "doc";
}

// A skill root is the nearest ancestor directory under skills/ that contains
// SKILL.md — this lets a skill live directly under skills/<name>/ or nested
// one level deeper under an organizational category (skills/dotnet/<name>/),
// without that category folder leaking into the install destination.
// Not every file under skills/ belongs to a skill — e.g. a loose upstream
// license file sitting directly in skills/. Only files under a directory
// that has a SKILL.md get the flattened skill destination.
function findSkillRoot(absFilePath: string, skillsRoot: string): string | undefined {
  let dir = dirname(absFilePath);
  while (dir.startsWith(skillsRoot)) {
    if (existsSync(join(dir, "SKILL.md"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

function destFor(scope: "global" | "project", scopeRoot: string, absPath: string, relPath: string): string {
  const skillsRoot = join(scopeRoot, "skills");
  const root = classify(relPath) === "skill" ? findSkillRoot(absPath, skillsRoot) : undefined;

  if (!root) {
    return scope === "global" ? globalDestPath(relPath) : projectDestPath(relPath);
  }

  const rootSegments = relative(skillsRoot, root).split(/[\\/]/);
  const skillName = rootSegments[rootSegments.length - 1];
  const restPath = relative(root, absPath);

  return scope === "global" ? globalSkillDestPath(skillName, restPath) : projectSkillDestPath(skillName, restPath);
}

function buildScope(scope: "global" | "project"): CatalogEntry[] {
  const scopeRoot = join(CATALOG_ROOT, scope);
  if (!existsSync(scopeRoot)) return [];

  return walk(scopeRoot)
    .filter((f) => !f.endsWith("ATTRIBUTION.md") && !f.endsWith(".DS_Store"))
    .map((absPath) => {
      const relPath = relative(scopeRoot, absPath);
      return {
        id: `${scope}:${relPath}`,
        scope,
        type: classify(relPath),
        sourcePath: relative(process.cwd(), absPath),
        destPath: destFor(scope, scopeRoot, absPath, relPath),
      } satisfies CatalogEntry;
    });
}

const catalog: CatalogEntry[] = [...buildScope("global"), ...buildScope("project")];

mkdirSync(join(process.cwd(), "src", "generated"), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(catalog, null, 2) + "\n");

console.log(`catalog:build — wrote ${catalog.length} entries to ${relative(process.cwd(), OUT_FILE)}`);
