import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type { CatalogEntry } from "../src/lib/types.js";
import { globalDestPath, globalSkillDestPath, projectDestPath, projectSkillDestPath } from "../src/lib/paths.js";

const CATALOG_ROOT = join(process.cwd(), "catalog");
const OUT_FILE = join(process.cwd(), "src", "generated", "catalog.json");
const RULES_DIR = join(CATALOG_ROOT, "global", "rules");
const CLAUDE_MD = join(CATALOG_ROOT, "global", "CLAUDE.md");
const RULES_INDEX_START = "<!-- RULES-INDEX:START -->";
const RULES_INDEX_END = "<!-- RULES-INDEX:END -->";

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

function syncRulesIndex(): void {
  if (!existsSync(RULES_DIR) || !existsSync(CLAUDE_MD)) return;

  const rows = readdirSync(RULES_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((file) => {
      const contents = readFileSync(join(RULES_DIR, file), "utf8");
      const match = contents.match(/^Applies when:\s*(.+)$/m);
      const appliesWhen = match ? match[1].trim() : "(no 'Applies when:' line found)";
      return `| \`rules/${file}\` | ${appliesWhen} |`;
    });

  const table = ["| Rule file | When it applies |", "| --- | --- |", ...rows].join("\n");
  const block = `${RULES_INDEX_START}\n${table}\n${RULES_INDEX_END}`;

  const claudeMd = readFileSync(CLAUDE_MD, "utf8");
  const pattern = new RegExp(`${RULES_INDEX_START}[\\s\\S]*?${RULES_INDEX_END}`);
  if (!pattern.test(claudeMd)) {
    console.warn(`catalog:build — no ${RULES_INDEX_START}/${RULES_INDEX_END} markers found in ${relative(process.cwd(), CLAUDE_MD)}, skipping Rules Index sync`);
    return;
  }

  writeFileSync(CLAUDE_MD, claudeMd.replace(pattern, block));
  console.log(`catalog:build — synced Rules Index (${rows.length} rules) in ${relative(process.cwd(), CLAUDE_MD)}`);
}

const catalog: CatalogEntry[] = [...buildScope("global"), ...buildScope("project")];

mkdirSync(join(process.cwd(), "src", "generated"), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(catalog, null, 2) + "\n");
syncRulesIndex();

console.log(`catalog:build — wrote ${catalog.length} entries to ${relative(process.cwd(), OUT_FILE)}`);
