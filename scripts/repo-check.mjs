import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredPaths = [
  ".git",
  "apps/mobile",
  "apps/web",
  "apps/admin",
  "apps/api",
  "packages/ui",
  "packages/brand",
  "packages/types",
  "packages/config",
  "packages/billing",
  "packages/ai",
  "packages/sdk",
  ".codex/skills/platform-project/SKILL.md",
  ".github/workflows/ci.yml"
];

const missingPaths = requiredPaths.filter((relativePath) =>
  !existsSync(path.join(root, relativePath))
);

if (missingPaths.length > 0) {
  console.error("Repository structure is missing required paths:");
  for (const missingPath of missingPaths) {
    console.error(`- ${missingPath}`);
  }
  process.exit(1);
}

if (!existsSync(path.join(root, ".git"))) {
  console.error("Repository check failed: .git directory is missing.");
  process.exit(1);
}

console.log("Repository structure check passed.");
