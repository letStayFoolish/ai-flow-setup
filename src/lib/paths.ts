import { homedir } from "node:os";
import { join } from "node:path";

const GLOBAL_CLAUDE_ROOT = "~/.claude";
const SKILLS_DIR_PREFIX = `${GLOBAL_CLAUDE_ROOT}/skills/`;

export function globalDestPath(relPath: string): string {
  return join(GLOBAL_CLAUDE_ROOT, relPath);
}

export function projectDestPath(relPath: string): string {
  return join(".", relPath);
}

export function expandDestPath(destPath: string, cwd: string): string {
  return destPath.startsWith("~") ? join(homedir(), destPath.slice(1)) : join(cwd, destPath);
}

export function skillRelPathFromDestPath(destPath: string): string {
  return destPath.startsWith(SKILLS_DIR_PREFIX) ? destPath.slice(SKILLS_DIR_PREFIX.length) : destPath;
}

export function skillNameFromDestPath(destPath: string): string {
  return skillRelPathFromDestPath(destPath).split("/")[0];
}
