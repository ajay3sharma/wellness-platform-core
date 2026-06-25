import path from "node:path";
import { spawn } from "node:child_process";
import { createArtifactRun, writeArtifactRegistry } from "./artifact-runs.mjs";
import { loadWorkspaceEnv } from "./load-workspace-env.mjs";

const root = process.cwd();
const playwrightCliPath = path.join(root, "node_modules", "@playwright", "test", "cli.js");
const artifactRun = await createArtifactRun(root, "screenshots", "corepack pnpm screenshots");

loadWorkspaceEnv(root);

const env = {
  ...process.env,
  NODE_ENV: "production",
  EXPO_WEB_PORT: process.env.EXPO_WEB_PORT ?? "8082",
  PLAYWRIGHT_SCREENSHOT_MODE: "1",
  PLAYWRIGHT_SCREENSHOT_RUN_ID: artifactRun.runId,
  PLAYWRIGHT_SCREENSHOT_COMMIT_SHA: artifactRun.commitSha,
  PLAYWRIGHT_SCREENSHOT_DIR: artifactRun.runRoot,
  PLAYWRIGHT_ARTIFACT_DIR: path.join(artifactRun.runRoot, "playwright"),
  SCREENSHOT_MOBILE_URL: process.env.SCREENSHOT_MOBILE_URL ?? "http://localhost:8082",
  PATH: [path.join(root, "node_modules", ".bin"), process.env.PATH]
    .filter(Boolean)
    .join(path.delimiter)
};

const nodeCommand = process.execPath;

const oneOffCommands = [
  ["./scripts/run-workspace-script.mjs", "@platform/api", "prisma:generate"],
  ["./scripts/run-workspace-script.mjs", "@platform/api", "build"],
  ["./scripts/run-workspace-script.mjs", "@platform/web", "build"],
  ["./scripts/run-workspace-script.mjs", "@platform/admin", "build"]
];

const longRunningServers = [
  {
    name: "api",
    command: nodeCommand,
    args: ["./scripts/run-workspace-script.mjs", "@platform/api", "start"],
    url: "http://127.0.0.1:4000/api/v1/health",
    timeoutMs: 180_000
  },
  {
    name: "web",
    command: nodeCommand,
    args: ["./scripts/run-workspace-script.mjs", "@platform/web", "start"],
    url: "http://127.0.0.1:3000/store",
    timeoutMs: 240_000
  },
  {
    name: "admin",
    command: nodeCommand,
    args: ["./scripts/run-workspace-script.mjs", "@platform/admin", "start"],
    url: "http://127.0.0.1:3001/login",
    timeoutMs: 240_000
  },
  {
    name: "mobile-web",
    command: nodeCommand,
    args: ["./scripts/run-workspace-script.mjs", "@platform/mobile", "web"],
    url: env.SCREENSHOT_MOBILE_URL,
    timeoutMs: 300_000
  }
];

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*m/gu, "");
}

function spawnCommand(command, args = [], options = {}) {
  return spawn(command, args, {
    cwd: root,
    env,
    stdio: "inherit",
    ...options
  });
}

async function runCommand(command, args = []) {
  await new Promise((resolve, reject) => {
    const child = spawnCommand(command, args);

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(
        new Error(
          `Command failed with exit code ${code ?? 1}: ${[command, ...args].join(" ")}`
        )
      );
    });

    child.on("error", reject);
  });
}

async function stopChild(child) {
  if (!child?.pid) {
    return;
  }

  await new Promise((resolve) => {
    let settled = false;
    const timeout = setTimeout(() => finish(), 3_000);
    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      resolve(undefined);
    };

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });

      killer.on("exit", finish);
      killer.on("error", finish);
      return;
    }

    child.kill("SIGTERM");
    child.once("exit", finish);
  });
}

async function waitForUrl(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "No response yet.";

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }

      lastError = `Received ${response.status} from ${url}.`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

async function isUrlReady(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function runPlaywright() {
  await new Promise((resolve, reject) => {
    const child = spawn(nodeCommand, [playwrightCliPath, "test", "-c", "playwright.screenshots.config.ts"], {
      cwd: root,
      env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let settled = false;
    let successSeen = false;
    let failureSeen = false;
    let outputTail = "";
    let successTeardownTimer;

    const settle = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(successTeardownTimer);

      if (error) {
        reject(error);
        return;
      }

      resolve(undefined);
    };

    const inspectOutput = (chunk, stream) => {
      const text = chunk.toString();
      stream.write(chunk);

      outputTail = `${outputTail}${stripAnsi(text)}`.slice(-4_000);

      if (/\b(failed|timed out|interrupted)\b/iu.test(outputTail)) {
        failureSeen = true;
      }

      if (/\b\d+\s+passed\s+\([^)]+\)/iu.test(outputTail) && !failureSeen) {
        successSeen = true;
        successTeardownTimer ??= setTimeout(() => {
          console.log("[screenshots] Playwright reported all captures passed; cleaning up process tree.");
          void stopChild(child).finally(() => settle());
        }, 3_000);
      }
    };

    child.stdout?.on("data", (chunk) => inspectOutput(chunk, process.stdout));
    child.stderr?.on("data", (chunk) => inspectOutput(chunk, process.stderr));

    child.on("exit", (code) => {
      if (code === 0 || (successSeen && !failureSeen)) {
        settle();
        return;
      }

      settle(new Error(`Playwright screenshots failed with exit code ${code ?? 1}.`));
    });

    child.on("error", settle);
  });
}

const children = [];
let exitCode = 0;
let registryStatus = "passed";

try {
  console.log(`[screenshots] Writing this run to ${artifactRun.artifactPath}`);

  for (const args of oneOffCommands) {
    await runCommand(nodeCommand, args);
  }

  for (const server of longRunningServers) {
    if (await isUrlReady(server.url)) {
      console.log(`[screenshots] Reusing existing ${server.name} server at ${server.url}`);
      continue;
    }

    const child = spawnCommand(server.command, server.args);
    children.push(child);
    await waitForUrl(server.url, server.timeoutMs);
  }

  await runPlaywright();
} catch (error) {
  console.error(error);
  exitCode = 1;
  registryStatus = "failed";
} finally {
  try {
    await Promise.all(children.reverse().map((child) => stopChild(child)));
  } catch (error) {
    console.error(error);
    exitCode = 1;
    registryStatus = "failed";
  } finally {
    await writeArtifactRegistry(artifactRun, registryStatus, {
      runManifestPath: `${artifactRun.artifactPath}/index.json`
    });
  }
}

process.exit(exitCode);
