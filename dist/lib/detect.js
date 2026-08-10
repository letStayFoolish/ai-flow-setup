import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
const PROJECT_MARKERS = ["CLAUDE.md", "CONTEXT-MAP.md", "CONTEXT.md"];
export function detectProjectKind(cwd) {
    const hasAnyMarker = PROJECT_MARKERS.some((marker) => existsSync(join(cwd, marker)));
    return hasAnyMarker ? "brownfield" : "greenfield";
}
export function detectGlobalSetup() {
    const path = join(homedir(), ".claude");
    return { exists: existsSync(path), path };
}
