import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { CatalogEntry } from "./types.js";
import { skillNameFromDestPath } from "./paths.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// package root: dist/lib/catalog.js -> dist/lib -> dist -> <package root>
export const packageRoot = join(__dirname, "..", "..");

export type { CatalogEntry } from "./types.js";

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
