import path from "node:path";
import { spawn } from "node:child_process";

const appRoot = process.cwd();
const fixScript = path.resolve(appRoot, "../../scripts/fix-esm-specifiers.mjs");
const entryFile = path.resolve(appRoot, "dist/apps/api/src/main.js");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: appRoot,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed with exit code ${code ?? 1}.`));
    });

    child.on("error", reject);
  });
}

await run(process.execPath, [fixScript, "dist/apps/api/src"]);

const server = spawn(process.execPath, [entryFile], {
  cwd: appRoot,
  stdio: "inherit"
});

server.on("exit", (code) => {
  process.exit(code ?? 0);
});

server.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
