import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const scanRoots = [
  path.join(root, "apps"),
  path.join(root, "packages")
];
const allowedFiles = new Set([
  path.join(root, "packages", "brand", "src", "brands", "moveyou.ts")
]);
const forbiddenTokens = ["MoveYOU", "Stretch. Strengthen. Renew."];
const violations = [];
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const ignoredDirectories = new Set([
  "dist",
  "node_modules",
  ".next",
  ".expo",
  ".turbo",
  "coverage"
]);

function walk(currentPath) {
  for (const entry of readdirSync(currentPath)) {
    const entryPath = path.join(currentPath, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      if (ignoredDirectories.has(entry)) {
        continue;
      }

      walk(entryPath);
      continue;
    }

    if (!allowedExtensions.has(path.extname(entryPath))) {
      continue;
    }

    if (allowedFiles.has(entryPath)) {
      continue;
    }

    const source = readFileSync(entryPath, "utf8");

    for (const token of forbiddenTokens) {
      if (source.includes(token)) {
        violations.push(`${path.relative(root, entryPath)} contains "${token}"`);
      }
    }
  }
}

for (const scanRoot of scanRoots) {
  walk(scanRoot);
}

if (violations.length > 0) {
  console.error("Brand hardcode check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Brand hardcode check passed.");
