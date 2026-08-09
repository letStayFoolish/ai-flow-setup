import { readFileSync } from "node:fs";
import { createTwoFilesPatch } from "diff";
import * as clack from "@clack/prompts";

export function printDiff(sourcePath: string, destPath: string, incoming: string, existing: string): void {
  const patch = createTwoFilesPatch(destPath, destPath, existing, incoming, "existing", "incoming");
  const colored = patch
    .split("\n")
    .map((line) => {
      if (line.startsWith("+") && !line.startsWith("+++")) return `\x1b[32m${line}\x1b[0m`;
      if (line.startsWith("-") && !line.startsWith("---")) return `\x1b[31m${line}\x1b[0m`;
      return line;
    })
    .join("\n");
  clack.log.message(colored, { symbol: "" });
}

export function mergeAppendMissing(existing: string, incoming: string): string {
  const existingLines = new Set(existing.split("\n"));
  const missingLines = incoming.split("\n").filter((line) => line.trim() !== "" && !existingLines.has(line));
  if (missingLines.length === 0) return existing;
  return `${existing.trimEnd()}\n\n${missingLines.join("\n")}\n`;
}

export function readExisting(destPath: string): string {
  return readFileSync(destPath, "utf-8");
}
