#!/usr/bin/env node
import { Command } from "commander";
import * as clack from "@clack/prompts";
import { detectGlobalSetup, detectProjectKind } from "./lib/detect.js";
import { loadCatalog } from "./lib/catalog.js";
import { askSkillInstallMode, confirmProjectKind, selectEntries } from "./lib/prompts.js";
import { installEntries, installSkills } from "./lib/install.js";

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

    const skillEntries = selected.filter((entry) => entry.type === "skill");
    const otherEntries = selected.filter((entry) => entry.type !== "skill");

    await installEntries(otherEntries, cwd);

    if (skillEntries.length > 0) {
      const mode = await askSkillInstallMode();
      await installSkills(skillEntries, cwd, mode);
    }

    clack.outro("Done.");
  });

program.parseAsync(process.argv);
