import path from "node:path";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";

function formatTimestamp(date = new Date()) {
  return date
    .toISOString()
    .replace("T", "_")
    .replace(/\.\d{3}Z$/u, "")
    .replaceAll(":", "-");
}

function toPortablePath(value) {
  return value.replaceAll("\\", "/");
}

export function getGitShortSha(root) {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return "no-git";
  }
}

export async function createArtifactRun(root, kind, command) {
  const commitSha = getGitShortSha(root);
  const startedAt = new Date().toISOString();
  const registryRoot = path.join(root, "test-results", kind);
  const runsRoot = path.join(registryRoot, "runs");
  const baseRunId = `${formatTimestamp(new Date(startedAt))}-${commitSha}`;
  let runId = baseRunId;
  let runRoot = path.join(runsRoot, runId);

  await mkdir(runsRoot, { recursive: true });

  for (let attempt = 1; ; attempt += 1) {
    try {
      await mkdir(runRoot);
      break;
    } catch (error) {
      if (error?.code !== "EEXIST") {
        throw error;
      }

      runId = `${baseRunId}-${attempt + 1}`;
      runRoot = path.join(runsRoot, runId);
    }
  }

  return {
    kind,
    command,
    commitSha,
    startedAt,
    runId,
    registryRoot,
    runRoot,
    artifactPath: toPortablePath(path.relative(root, runRoot))
  };
}

export async function ensureArtifactRegistry(root, kind) {
  const registryRoot = path.join(root, "test-results", kind);

  await mkdir(path.join(registryRoot, "runs"), { recursive: true });
}

export async function writeArtifactRegistry(run, status, extra = {}) {
  const indexPath = path.join(run.registryRoot, "index.json");
  const finishedAt = new Date().toISOString();
  const record = {
    runId: run.runId,
    startedAt: run.startedAt,
    finishedAt,
    commitSha: run.commitSha,
    command: run.command,
    status,
    artifactPath: run.artifactPath,
    ...extra
  };

  let previousRuns = [];

  try {
    const current = JSON.parse(await readFile(indexPath, "utf8"));
    previousRuns = Array.isArray(current.runs) ? current.runs : [];
  } catch {
    previousRuns = [];
  }

  const nextRuns = [...previousRuns.filter((entry) => entry.runId !== run.runId), record];
  const registry = {
    latestRunId: run.runId,
    updatedAt: finishedAt,
    runs: nextRuns
  };

  await mkdir(run.registryRoot, { recursive: true });
  await writeFile(indexPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}
