import { homedir } from "node:os";
import { join } from "node:path";
const GLOBAL_CLAUDE_ROOT = "~/.claude";
const SKILLS_SEGMENT = "skills/";
export function globalDestPath(relPath) {
    return join(GLOBAL_CLAUDE_ROOT, relPath);
}
export function projectDestPath(relPath) {
    return join(".", relPath);
}
export function globalSkillDestPath(skillName, restPath) {
    return join(GLOBAL_CLAUDE_ROOT, "skills", skillName, restPath);
}
export function projectSkillDestPath(skillName, restPath) {
    return join(".claude", "skills", skillName, restPath);
}
export function expandDestPath(destPath, cwd) {
    return destPath.startsWith("~") ? join(homedir(), destPath.slice(1)) : join(cwd, destPath);
}
// Works for both global ("~/.claude/skills/<name>/...") and project
// (".claude/skills/<name>/...") destinations — the skill name is always the
// path segment right after "skills/".
export function skillRelPathFromDestPath(destPath) {
    const idx = destPath.indexOf(SKILLS_SEGMENT);
    return idx === -1 ? destPath : destPath.slice(idx + SKILLS_SEGMENT.length);
}
export function skillNameFromDestPath(destPath) {
    return skillRelPathFromDestPath(destPath).split("/")[0];
}
