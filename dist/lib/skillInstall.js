import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { lstatSync, mkdirSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import * as clack from "@clack/prompts";
import { skillNameFromDestPath, skillRelPathFromDestPath } from "./paths.js";
import { askSymlinkConflict } from "./prompts.js";
import { installEntries } from "./install.js";
const SKILLS_SOURCE_ROOT = join(homedir(), ".ai-flow-setup", "skills-source");
function skillDestRoot(entry, cwd, mode) {
    const relPath = skillRelPathFromDestPath(entry.destPath);
    if (mode === "project-local")
        return join(cwd, ".claude", "skills", relPath);
    if (mode === "symlink-global")
        return join(SKILLS_SOURCE_ROOT, relPath);
    return join(homedir(), ".claude", "skills", relPath);
}
async function ensureSkillSymlink(skillName) {
    const source = join(SKILLS_SOURCE_ROOT, skillName);
    const target = join(homedir(), ".claude", "skills", skillName);
    mkdirSync(dirname(target), { recursive: true });
    let stat;
    try {
        stat = lstatSync(target);
    }
    catch (err) {
        if (err.code !== "ENOENT")
            throw err;
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
    }
    else if (choice === "keep") {
        clack.log.info(`kept existing ~/.claude/skills/${skillName}`);
    }
    else {
        clack.log.warn(`skipped ~/.claude/skills/${skillName}`);
    }
}
export async function installSkills(skillEntries, cwd, mode) {
    if (skillEntries.length === 0)
        return;
    await installEntries(skillEntries, cwd, (entry, c) => skillDestRoot(entry, c, mode));
    if (mode !== "symlink-global")
        return;
    const skillNames = new Set(skillEntries.map((entry) => skillNameFromDestPath(entry.destPath)));
    for (const name of skillNames) {
        await ensureSkillSymlink(name);
    }
}
