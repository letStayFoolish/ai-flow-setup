import * as clack from "@clack/prompts";
import { groupBySkill } from "./catalog.js";
export async function selectEntries(entries) {
    const wantsAll = await clack.confirm({
        message: "Install everything in the catalog?",
        initialValue: false,
    });
    if (clack.isCancel(wantsAll)) {
        clack.cancel("Cancelled.");
        process.exit(0);
    }
    if (wantsAll)
        return entries;
    const groups = groupBySkill(entries);
    const options = [...groups.entries()].map(([key, group]) => {
        const groupLabel = `${group[0].scope}/${group[0].type}`;
        const itemLabel = key.startsWith("skill:") ? key.slice("skill:".length) : group[0].destPath;
        return { value: key, label: `${groupLabel} — ${itemLabel}` };
    });
    clack.note([
        "↑/↓  move (list scrolls automatically once it's taller than your terminal)",
        "Space  toggle the highlighted item",
        "Enter  confirm selection and continue",
        "Ctrl+C  cancel",
    ].join("\n"), "Keys");
    // Plain multiselect, not groupMultiselect: groupMultiselect renders its
    // entire option list on every keypress with no viewport limit, which
    // corrupts the terminal once the catalog has more entries than fit on
    // screen. multiselect windows itself to terminal height instead.
    const selected = await clack.multiselect({
        message: "Select what to pull into place:",
        options,
        required: true,
    });
    if (clack.isCancel(selected)) {
        clack.cancel("Cancelled.");
        process.exit(0);
    }
    const selectedKeys = new Set(selected);
    return [...groups.entries()]
        .filter(([key]) => selectedKeys.has(key))
        .flatMap(([, group]) => group);
}
export async function askSymlinkConflict(target) {
    const choice = await clack.select({
        message: `${target} already exists and is not a symlink to the managed copy. What do you want to do?`,
        options: [
            { value: "keep", label: "Keep existing — do nothing" },
            { value: "replace", label: "Replace it with a symlink to the managed copy" },
            { value: "skip", label: "Skip for now" },
        ],
    });
    if (clack.isCancel(choice)) {
        clack.cancel("Cancelled.");
        process.exit(0);
    }
    return choice;
}
export async function askBulkConflictChoice(conflictCount) {
    const choice = await clack.select({
        message: `${conflictCount} files already exist and differ. Apply one choice to all of them, or decide per file?`,
        options: [
            { value: "per-file", label: "Decide per file — show a diff for each" },
            { value: "keep", label: "Keep existing for all — do nothing" },
            { value: "overwrite", label: "Overwrite all with incoming version" },
            { value: "merge", label: "Merge all — append missing incoming lines" },
            { value: "skip", label: "Skip all for now" },
        ],
    });
    if (clack.isCancel(choice)) {
        clack.cancel("Cancelled.");
        process.exit(0);
    }
    return choice;
}
export async function askConflictChoice(destPath) {
    const choice = await clack.select({
        message: `${destPath} already exists and differs. What do you want to do?`,
        options: [
            { value: "keep", label: "Keep existing file — do nothing" },
            { value: "overwrite", label: "Overwrite with incoming version" },
            { value: "merge", label: "Append missing incoming lines to existing file" },
            { value: "skip", label: "Skip this file for now" },
        ],
    });
    if (clack.isCancel(choice)) {
        clack.cancel("Cancelled.");
        process.exit(0);
    }
    return choice;
}
