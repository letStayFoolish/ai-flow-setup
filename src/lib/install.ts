import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import * as clack from "@clack/prompts";
import type { CatalogEntry } from "./catalog.js";
import { packageRoot } from "./catalog.js";
import { askBulkConflictChoice, askConflictChoice, askSymlinkConflict } from "./prompts.js";
import type { ConflictChoice, SkillInstallMode } from "./prompts.js";
import { mergeAppendMissing, printDiff, readExisting } from "./diffApply.js";

const SKILLS_SOURCE_ROOT = join(homedir(), ".ai-flow-setup", "skills-source");

function resolveDest(entry: CatalogEntry, cwd: string): string {
  return entry.destPath.startsWith("~")
    ? join(homedir(), entry.destPath.slice(1))
    : join(cwd, entry.destPath);
}

function skillDestRoot(entry: CatalogEntry, cwd: string, mode: SkillInstallMode): string {
  const relPath = entry.destPath.replace(/^~\/\.claude\/skills\//, "");
  if (mode === "project-local") return join(cwd, ".claude", "skills", relPath);
  if (mode === "symlink-global") return join(SKILLS_SOURCE_ROOT, relPath);
  return resolveDest(entry, cwd);
}

function applyChoice(destAbs: string, existing: string, incoming: string, choice: ConflictChoice): void {
  if (choice === "overwrite") {
    writeFileSync(destAbs, incoming);
    clack.log.success(`overwrote ${destAbs}`);
  } else if (choice === "merge") {
    writeFileSync(destAbs, mergeAppendMissing(existing, incoming));
    clack.log.success(`merged into ${destAbs}`);
  } else if (choice === "keep") {
    clack.log.info(`kept existing ${destAbs}`);
  } else {
    clack.log.warn(`skipped ${destAbs}`);
  }
}

export async function installEntries(
  entries: CatalogEntry[],
  cwd: string,
  destResolver: (entry: CatalogEntry, cwd: string) => string = resolveDest,
): Promise<void> {
  const conflicts: { entry: CatalogEntry; destAbs: string; existing: string; incoming: string }[] = [];

  for (const entry of entries) {
    const destAbs = destResolver(entry, cwd);
    const incoming = readFileSync(join(packageRoot, entry.sourcePath), "utf-8");

    if (!existsSync(destAbs)) {
      mkdirSync(dirname(destAbs), { recursive: true });
      writeFileSync(destAbs, incoming);
      clack.log.success(`created ${destAbs}`);
      continue;
    }

    const existing = readExisting(destAbs);
    if (existing === incoming) {
      clack.log.info(`unchanged ${destAbs}`);
      continue;
    }

    conflicts.push({ entry, destAbs, existing, incoming });
  }

  if (conflicts.length === 0) return;

  const bulkChoice = conflicts.length > 1 ? await askBulkConflictChoice(conflicts.length) : "per-file";

  for (const { destAbs, existing, incoming } of conflicts) {
    if (bulkChoice !== "per-file") {
      applyChoice(destAbs, existing, incoming, bulkChoice);
      continue;
    }
    printDiff(destAbs, destAbs, incoming, existing);
    const choice = await askConflictChoice(destAbs);
    applyChoice(destAbs, existing, incoming, choice);
  }
}

async function ensureSkillSymlink(skillName: string): Promise<void> {
  const source = join(SKILLS_SOURCE_ROOT, skillName);
  const target = join(homedir(), ".claude", "skills", skillName);
  mkdirSync(dirname(target), { recursive: true });

  let stat: ReturnType<typeof lstatSync> | undefined;
  try {
    stat = lstatSync(target);
  } catch {
    stat = undefined;
  }

  if (!stat) {
    symlinkSync(source, target, "dir");
    clack.log.success(`symlinked ~/.claude/skills/${skillName} -> ${source}`);
    return;
  }

  if (stat.isSymbolicLink() && readlinkSync(target) === source) {
    clack.log.info(`unchanged symlink ~/.claude/skills/${skillName}`);
    return;
  }

  const choice = await askSymlinkConflict(`~/.claude/skills/${skillName}`);
  if (choice === "replace") {
    rmSync(target, { recursive: true, force: true });
    symlinkSync(source, target, "dir");
    clack.log.success(`replaced ~/.claude/skills/${skillName} with a symlink`);
  } else if (choice === "keep") {
    clack.log.info(`kept existing ~/.claude/skills/${skillName}`);
  } else {
    clack.log.warn(`skipped ~/.claude/skills/${skillName}`);
  }
}

export async function installSkills(skillEntries: CatalogEntry[], cwd: string, mode: SkillInstallMode): Promise<void> {
  if (skillEntries.length === 0) return;

  await installEntries(skillEntries, cwd, (entry, c) => skillDestRoot(entry, c, mode));

  if (mode !== "symlink-global") return;

  const skillNames = new Set(
    skillEntries.map((entry) => entry.destPath.replace(/^~\/\.claude\/skills\//, "").split("/")[0]),
  );
  for (const name of skillNames) {
    await ensureSkillSymlink(name);
  }
}
