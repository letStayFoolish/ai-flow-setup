#!/usr/bin/env node
import { Command } from "commander";
import * as clack from "@clack/prompts";
import { detectGlobalSetup, detectProjectKind } from "./lib/detect.js";
import { loadCatalog, packageVersion } from "./lib/catalog.js";
import { skillNameFromDestPath } from "./lib/paths.js";
import { askSkillInstallMode, confirmProjectKind, selectEntries } from "./lib/prompts.js";
import { installEntries } from "./lib/install.js";
import { installSkills } from "./lib/skillInstall.js";

const program = new Command();
const version = packageVersion();

program
  .name("ai-flow-setup")
  .description("Pull CLAUDE.md, rules, skills, and commands from your AI-flow catalog into this machine/project.")
  .version(version)
  .action(async () => {
    const cwd = process.cwd();

    clack.intro("ai-flow-setup");
    clack.note(
      [
        "Nemanja Karaklajić — github.com/letStayFoolish",
        `Catalog snapshot v${version} — this is what got pulled just now.`,
        "",
        "Some skills in this catalog are reused from mentor Matt Pocock's",
        "mattpocock/skills (https://www.skills.sh/mattpocock/skills), not",
        "original work. See ATTRIBUTION.md for the full list.",
      ].join("\n"),
      "ai-flow-setup",
    );
    clack.note(
      [
        "Single choice (select):  ↑/↓ move, Enter confirm",
        "Yes/No (confirm):  ←/→ or Y/N, Enter confirm",
        "Multiple choice (multiselect):  ↑/↓ move, Space toggle, Enter confirm",
        "Any prompt:  Ctrl+C cancels",
      ].join("\n"),
      "How to use these prompts",
    );

    const global = detectGlobalSetup();
    clack.log.info(
      global.exists
        ? `Global setup found at ${global.path}`
        : `No global setup at ${global.path} — it will be created as needed`,
    );

    const detectedKind = detectProjectKind(cwd);
    const kind = await confirmProjectKind(detectedKind);
    clack.log.info(`Treating this as ${kind}.`);

    const catalog = loadCatalog();
    const selected = await selectEntries(catalog);

    // Project-scope skills (e.g. company-internal) always install straight
    // into this project's .claude/skills/ — the copy/symlink/project-local
    // choice below only makes sense for machine-wide (global) skills.
    const globalSkillEntries = selected.filter((entry) => entry.type === "skill" && entry.scope === "global");
    const otherEntries = selected.filter((entry) => !(entry.type === "skill" && entry.scope === "global"));

    await installEntries(otherEntries, cwd);

    if (globalSkillEntries.length > 0) {
      const mode = await askSkillInstallMode();
      await installSkills(globalSkillEntries, cwd, mode);
    }

    const projectSkillNames = [
      ...new Set(
        selected
          .filter((entry) => entry.type === "skill" && entry.scope === "project")
          .map((entry) => skillNameFromDestPath(entry.destPath)),
      ),
    ];
    const globalSkillNames = [...new Set(globalSkillEntries.map((entry) => skillNameFromDestPath(entry.destPath)))];

    // Skills load at session start, so anything installed just now only
    // becomes runnable next time Claude Code starts — spell out the exact
    // command and where it works, per scope.
    if (globalSkillNames.length > 0 || projectSkillNames.length > 0) {
      const lines: string[] = [];
      if (globalSkillNames.length > 0) {
        lines.push("Global — any project, once you restart your terminal/session:");
        lines.push(...globalSkillNames.map((name) => `  /${name}`));
      }
      if (projectSkillNames.length > 0) {
        if (lines.length > 0) lines.push("");
        lines.push(`Project-only — from inside ${cwd}, once you restart your session:`);
        lines.push(...projectSkillNames.map((name) => `  /${name}`));
      }
      clack.note(lines.join("\n"), "Run these next session");
    }

    clack.outro("Done.");
  });

program.parseAsync(process.argv);
