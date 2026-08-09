import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { CatalogEntry } from "../src/lib/types.js";
import { globalDestPath, projectDestPath } from "../src/lib/paths.js";

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

function classify(scope: "global" | "project", relPath: string): CatalogEntry["type"] {
  if (relPath.startsWith("skills/")) return "skill";
  if (relPath.startsWith("rules/")) return "rule";
  if (relPath.startsWith("commands/")) return "command";
  return "doc";
}

function destFor(scope: "global" | "project", relPath: string): string {
  return scope === "global" ? globalDestPath(relPath) : projectDestPath(relPath);
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
        type: classify(scope, relPath),
        sourcePath: relative(process.cwd(), absPath),
        destPath: destFor(scope, relPath),
      } satisfies CatalogEntry;
    });
}

const catalog: CatalogEntry[] = [...buildScope("global"), ...buildScope("project")];

mkdirSync(join(process.cwd(), "src", "generated"), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(catalog, null, 2) + "\n");

console.log(`catalog:build — wrote ${catalog.length} entries to ${relative(process.cwd(), OUT_FILE)}`);
