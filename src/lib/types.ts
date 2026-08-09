export type CatalogEntry = {
  id: string;
  scope: "global" | "project";
  type: "doc" | "rule" | "skill" | "command";
  sourcePath: string;
  destPath: string;
};
