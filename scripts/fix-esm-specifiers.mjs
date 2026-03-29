import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const targetDir = process.argv[2];

if (!targetDir) {
  console.error("Usage: node scripts/fix-esm-specifiers.mjs <directory>");
  process.exit(1);
}

const absoluteTargetDir = path.resolve(process.cwd(), targetDir);

function addJsExtension(source) {
  const patterns = [
    /(from\s+["'])(\.{1,2}\/[^"'?]+?)(["'])/g,
    /(import\s+["'])(\.{1,2}\/[^"'?]+?)(["'])/g,
    /(export\s+\*\s+from\s+["'])(\.{1,2}\/[^"'?]+?)(["'])/g
  ];

  return patterns.reduce(
    (value, pattern) =>
      value.replace(pattern, (_match, prefix, specifier, suffix) => {
        if (/\.(c|m)?js$/.test(specifier) || specifier.endsWith(".json")) {
          return `${prefix}${specifier}${suffix}`;
        }

        return `${prefix}${specifier}.js${suffix}`;
      }),
    source
  );
}

async function visit(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await visit(entryPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".js")) {
      continue;
    }

    const contents = await readFile(entryPath, "utf8");
    const updatedContents = addJsExtension(contents);

    if (updatedContents !== contents) {
      await writeFile(entryPath, updatedContents, "utf8");
    }
  }
}

const targetStats = await stat(absoluteTargetDir).catch(() => undefined);

if (!targetStats?.isDirectory()) {
  console.error(`Target directory not found: ${absoluteTargetDir}`);
  process.exit(1);
}

await visit(absoluteTargetDir);
