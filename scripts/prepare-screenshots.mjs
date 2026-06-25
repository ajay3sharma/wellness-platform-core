import path from "node:path";
import { ensureArtifactRegistry } from "./artifact-runs.mjs";

const root = process.cwd();

await ensureArtifactRegistry(root, "screenshots");
console.log(
  `[screenshots] Preserving existing screenshot evidence under ${path.join(
    root,
    "test-results",
    "screenshots",
    "runs"
  )}`
);
