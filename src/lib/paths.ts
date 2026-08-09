import { homedir } from "node:os";
import { join } from "node:path";

const GLOBAL_CLAUDE_ROOT = "~/.claude";
const SKILLS_SEGMENT = "skills/";

export function globalDestPath(relPath: string): string {
  return join(GLOBAL_CLAUDE_ROOT, relPath);
}

export function projectDestPath(relPath: string): string {
  return join(".", relPath);
}

export function globalSkillDestPath(skillName: string, restPath: string): string {
  return join(GLOBAL_CLAUDE_ROOT, "skills", skillName, restPath);
}

export function projectSkillDestPath(skillName: string, restPath: string): string {
  return join(".claude", "skills", skillName, restPath);
}

export function expandDestPath(destPath: string, cwd: string): string {
  return destPath.startsWith("~") ? join(homedir(), destPath.slice(1)) : join(cwd, destPath);
}

// Works for both global ("~/.claude/skills/<name>/...") and project
// (".claude/skills/<name>/...") destinations — the skill name is always the
// path segment right after "skills/".
export function skillRelPathFromDestPath(destPath: string): string {
  const idx = destPath.indexOf(SKILLS_SEGMENT);
  return idx === -1 ? destPath : destPath.slice(idx + SKILLS_SEGMENT.length);
}

export function skillNameFromDestPath(destPath: string): string {
  return skillRelPathFromDestPath(destPath).split("/")[0];
}
