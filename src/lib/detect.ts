import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type ProjectKind = "greenfield" | "brownfield";

const PROJECT_MARKERS = ["CLAUDE.md", "CONTEXT-MAP.md", "CONTEXT.md"];

export function detectProjectKind(cwd: string): ProjectKind {
  const hasAnyMarker = PROJECT_MARKERS.some((marker) => existsSync(join(cwd, marker)));
  return hasAnyMarker ? "brownfield" : "greenfield";
}

export function detectGlobalSetup(): { exists: boolean; path: string } {
  const path = join(homedir(), ".claude");
  return { exists: existsSync(path), path };
}
