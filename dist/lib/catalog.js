import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { skillNameFromDestPath } from "./paths.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
// package root: dist/lib/catalog.js -> dist/lib -> dist -> <package root>
export const packageRoot = join(__dirname, "..", "..");
// package.json's version is the single version tag for both the CLI and the
// catalog snapshot it ships — bump it whenever a skill is added or updated
// (see CONTRIBUTING.md) so `--version` and the install-time note stay accurate.
export function packageVersion() {
    const pkg = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf-8"));
    return pkg.version;
}
export function loadCatalog() {
    const catalogPath = join(__dirname, "..", "generated", "catalog.json");
    const raw = readFileSync(catalogPath, "utf-8");
    return JSON.parse(raw);
}
export function groupBySkill(entries) {
    const groups = new Map();
    for (const entry of entries) {
        const key = entry.type === "skill" ? `skill:${skillNameFromDestPath(entry.destPath)}` : entry.id;
        const group = groups.get(key) ?? [];
        group.push(entry);
        groups.set(key, group);
    }
    return groups;
}
