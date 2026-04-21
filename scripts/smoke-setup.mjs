import path from "node:path";
import { spawn } from "node:child_process";
import { loadWorkspaceEnv } from "./load-workspace-env.mjs";

const root = process.cwd();
loadWorkspaceEnv(root);

const env = {
  ...process.env,
  PATH: [path.join(root, "node_modules", ".bin"), process.env.PATH]
    .filter(Boolean)
    .join(path.delimiter)
};

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: "inherit",
      shell: process.platform === "win32"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code ?? 1}.`));
    });

    child.on("error", reject);
  });
}

await run("corepack", ["pnpm", "--filter", "@platform/api", "prisma:generate"]);
await run("corepack", [
  "pnpm",
  "--filter",
  "@platform/api",
  "exec",
  "prisma",
  "db",
  "push",
  "--schema",
  "prisma/schema.prisma"
]);
await run("node", ["./apps/api/scripts/seed-smoke.mjs"]);
