import path from "node:path";
import { spawn } from "node:child_process";
import { loadWorkspaceEnv } from "./load-workspace-env.mjs";

const [workspaceName, scriptName, ...extraArgs] = process.argv.slice(2);

if (!workspaceName || !scriptName) {
  console.error("Usage: node ./scripts/run-workspace-script.mjs <workspace> <script> [...args]");
  process.exit(1);
}

const root = process.cwd();
loadWorkspaceEnv(root);

const env = {
  ...process.env,
  PATH: [path.join(root, "node_modules", ".bin"), process.env.PATH]
    .filter(Boolean)
    .join(path.delimiter)
};

const command = ["corepack", "pnpm", "--filter", workspaceName, scriptName, ...extraArgs]
  .map((part) => (/\s/u.test(part) ? `"${part}"` : part))
  .join(" ");

const child = spawn(command, {
  cwd: root,
  env,
  stdio: "inherit",
  shell: true
});

let shuttingDown = false;

async function stopChildTree() {
  if (!child.pid || shuttingDown) {
    return;
  }

  shuttingDown = true;

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
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore"
      });

      killer.on("exit", finish);
      killer.on("error", finish);
      return;
    }

    child.kill("SIGTERM");
    child.once("exit", finish);
  });
}

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    void stopChildTree().finally(() => process.exit(0));
  });
}
