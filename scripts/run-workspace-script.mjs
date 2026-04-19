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

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
