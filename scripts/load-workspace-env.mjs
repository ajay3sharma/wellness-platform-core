import fs from "node:fs";
import path from "node:path";

function parseEnvContents(contents) {
  const entries = [];

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries.push([key, value]);
  }

  return entries;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(filePath);
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");

  for (const [key, value] of parseEnvContents(contents)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export function loadWorkspaceEnv(rootDir = process.cwd()) {
  const candidates = [
    path.join(rootDir, ".env"),
    path.join(rootDir, ".env.local")
  ];

  for (const filePath of candidates) {
    loadEnvFile(filePath);
  }
}
