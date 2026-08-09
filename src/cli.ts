#!/usr/bin/env node
import { Command } from "commander";
import * as clack from "@clack/prompts";
import { detectGlobalSetup, detectProjectKind } from "./lib/detect.js";
import { loadCatalog } from "./lib/catalog.js";
import { askSkillInstallMode, confirmProjectKind, selectEntries } from "./lib/prompts.js";
import { installEntries } from "./lib/install.js";
import { installSkills } from "./lib/skillInstall.js";

const program = new Command();

program
  .name("ai-flow-setup")
  .description("Pull CLAUDE.md, rules, skills, and commands from your AI-flow catalog into this machine/project.")
  .version("0.1.0")
  .action(async () => {
    const cwd = process.cwd();

    clack.intro("ai-flow-setup");
    clack.note(
      [
        "Nemanja Karaklajić — github.com/letStayFoolish",
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

    clack.outro("Done.");
  });

program.parseAsync(process.argv);
