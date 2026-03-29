import path from "node:path";
import { spawn } from "node:child_process";

const [task, ...extraArgs] = process.argv.slice(2);

if (!task) {
  console.error("Missing turbo task name.");
  process.exit(1);
}

const root = process.cwd();
const turboBinary = path.join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "turbo.cmd" : "turbo"
);
const env = {
  ...process.env,
  PATH: [root, process.env.PATH].filter(Boolean).join(path.delimiter)
};
const child = spawn(turboBinary, ["run", task, ...extraArgs], {
  cwd: root,
  env,
  stdio: "inherit",
  shell: process.platform === "win32"
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
