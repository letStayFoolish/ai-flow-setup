import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import * as clack from "@clack/prompts";
import type { CatalogEntry } from "./catalog.js";
import { packageRoot } from "./catalog.js";
import { expandDestPath } from "./paths.js";
import { askBulkConflictChoice, askConflictChoice } from "./prompts.js";
import type { ConflictChoice } from "./prompts.js";
import { mergeAppendMissing, printDiff, readExisting } from "./diffApply.js";

type FileConflict = {
  destAbs: string;
  existing: string;
  incoming: string;
};

function resolveDest(entry: CatalogEntry, cwd: string): string {
  return expandDestPath(entry.destPath, cwd);
}

function applyChoice(conflict: FileConflict, choice: ConflictChoice): void {
  const { destAbs, existing, incoming } = conflict;
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
  const conflicts: FileConflict[] = [];

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

    conflicts.push({ destAbs, existing, incoming });
  }

  if (conflicts.length === 0) return;

  const bulkChoice = conflicts.length > 1 ? await askBulkConflictChoice(conflicts.length) : "per-file";

  for (const conflict of conflicts) {
    if (bulkChoice !== "per-file") {
      applyChoice(conflict, bulkChoice);
      continue;
    }
    printDiff(conflict.destAbs, conflict.incoming, conflict.existing);
    const choice = await askConflictChoice(conflict.destAbs);
    applyChoice(conflict, choice);
  }
}
