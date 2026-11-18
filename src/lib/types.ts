export type CatalogEntry = {
  id: string;
  scope: "global" | "project";
  type: "doc" | "rule" | "skill" | "command" | "agent";
  sourcePath: string;
  destPath: string;
};
