import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export function detectGlobalSetup(): { exists: boolean; path: string } {
  const path = join(homedir(), ".claude");
  return { exists: existsSync(path), path };
}
