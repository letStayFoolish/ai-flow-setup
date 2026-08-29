#!/usr/bin/env node
import { Command } from "commander";
import * as clack from "@clack/prompts";
import { detectGlobalSetup } from "./lib/detect.js";
import { loadCatalog, packageVersion, resolveNames } from "./lib/catalog.js";
import { skillNameFromDestPath } from "./lib/paths.js";
import { selectEntries } from "./lib/prompts.js";
import { installEntries } from "./lib/install.js";
import { installSkills } from "./lib/skillInstall.js";
const SKILL_INSTALL_MODES = ["copy-global", "symlink-global", "project-local"];
function parseMode(raw) {
    if (!SKILL_INSTALL_MODES.includes(raw)) {
        clack.log.error(`invalid --mode "${raw}" — must be one of: ${SKILL_INSTALL_MODES.join(", ")}`);
        process.exit(1);
    }
    return raw;
}
async function resolveSelection(catalog, names) {
    if (names.length === 0) {
        clack.note([
            "Nemanja Karaklajić — github.com/letStayFoolish",
            "Some skills in this catalog are reused from mentor Matt Pocock's",
            "mattpocock/skills (https://www.skills.sh/mattpocock/skills), not",
            "original work. See ATTRIBUTION.md for the full list.",
        ].join("\n"), "ai-flow-setup");
        return selectEntries(catalog);
    }
    const { matched, unmatched, ambiguous } = resolveNames(catalog, names);
    for (const name of unmatched)
        clack.log.error(`no match for "${name}"`);
    for (const { name, candidates } of ambiguous) {
        clack.log.error(`"${name}" is ambiguous — matches: ${candidates.join(", ")}. Use one of these full names.`);
    }
    if (unmatched.length > 0 || ambiguous.length > 0)
        process.exit(1);
    return matched;
}
const program = new Command();
const version = packageVersion();
program
    .name("ai-flow-setup")
    .description("Pull CLAUDE.md, rules, skills, and commands from your AI-flow catalog into this machine/project.")
    .version(version)
    .argument("[names...]", "install these skills/rules/docs by name directly, skipping catalog browsing")
    .option("--mode <mode>", `global skill install mode (${SKILL_INSTALL_MODES.join("|")})`, "copy-global")
    .action(async (names, opts) => {
    const cwd = process.cwd();
    const mode = parseMode(opts.mode);
    clack.intro("ai-flow-setup");
    const global = detectGlobalSetup();
    clack.log.info(global.exists
        ? `Global setup found at ${global.path}`
        : `No global setup at ${global.path} — it will be created as needed`);
    const catalog = loadCatalog();
    const selected = await resolveSelection(catalog, names);
    // Project-scope skills (e.g. company-internal) always install straight
    // into this project's .claude/skills/ — --mode only applies to
    // machine-wide (global) skills.
    const globalSkillEntries = selected.filter((entry) => entry.type === "skill" && entry.scope === "global");
    const otherEntries = selected.filter((entry) => !(entry.type === "skill" && entry.scope === "global"));
    await installEntries(otherEntries, cwd);
    await installSkills(globalSkillEntries, cwd, mode);
    const projectSkillNames = [
        ...new Set(selected
            .filter((entry) => entry.type === "skill" && entry.scope === "project")
            .map((entry) => skillNameFromDestPath(entry.destPath))),
    ];
    const globalSkillNames = [...new Set(globalSkillEntries.map((entry) => skillNameFromDestPath(entry.destPath)))];
    // Skills load at session start, so anything installed just now only
    // becomes runnable next time Claude Code starts — spell out the exact
    // command and where it works, per scope.
    if (globalSkillNames.length > 0 || projectSkillNames.length > 0) {
        const lines = [];
        if (globalSkillNames.length > 0) {
            lines.push("Global — any project, once you restart your terminal/session:");
            lines.push(...globalSkillNames.map((name) => `  /${name}`));
        }
        if (projectSkillNames.length > 0) {
            if (lines.length > 0)
                lines.push("");
            lines.push(`Project-only — from inside ${cwd}, once you restart your session:`);
            lines.push(...projectSkillNames.map((name) => `  /${name}`));
        }
        clack.note(lines.join("\n"), "Run these next session");
    }
    clack.outro("Done.");
});
program.parseAsync(process.argv);
